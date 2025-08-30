import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import http from "http";
import {
  validateUrlFormat,
  validateUrlSecurity,
  checkUrlAccessibility,
  validateUrls,
  createSafeEmailUrl,
} from "../../utils/urlValidator.js";

// Mock server for testing URL accessibility
let mockServer: http.Server;
const mockServerPort = 3001;

beforeAll(async () => {
  // Set up a simple mock server for testing
  mockServer = http.createServer((req, res) => {
    if (req.url === "/valid") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<html><body>Valid page</body></html>");
    } else if (req.url === "/redirect") {
      res.writeHead(302, {
        Location: `http://localhost:${mockServerPort}/valid`,
      });
      res.end();
    } else if (req.url === "/slow") {
      // Simulate slow response
      setTimeout(() => {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<html><body>Slow page</body></html>");
      }, 6000); // 6 seconds - should timeout
    } else {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<html><body>Not found</body></html>");
    }
  });

  await new Promise<void>((resolve) => {
    mockServer.listen(mockServerPort, resolve);
  });
});

afterAll(async () => {
  if (mockServer) {
    await new Promise<void>((resolve) => {
      mockServer.close(resolve);
    });
  }
});

describe("URL Validator", () => {
  describe("validateUrlFormat", () => {
    it("should validate correct HTTP URLs", () => {
      const result = validateUrlFormat("http://example.com");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should validate correct HTTPS URLs", () => {
      const result = validateUrlFormat("https://example.com/path?query=value");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject invalid URLs", () => {
      const result = validateUrlFormat("not-a-url");
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject empty strings", () => {
      const result = validateUrlFormat("");
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject URLs without protocol", () => {
      const result = validateUrlFormat("example.com");
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("validateUrlSecurity", () => {
    it("should allow HTTP and HTTPS protocols by default", () => {
      const httpResult = validateUrlSecurity("http://example.com");
      const httpsResult = validateUrlSecurity("https://example.com");

      expect(httpResult.isValid).toBe(true);
      expect(httpsResult.isValid).toBe(true);
    });

    it("should allow localhost when explicitly permitted", () => {
      const result = validateUrlSecurity("http://localhost:3000", {
        allowLocal: true,
      });
      expect(result.isValid).toBe(true);
    });

    it("should block 127.0.0.1 by default", () => {
      const result = validateUrlSecurity("http://127.0.0.1:3000");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("blocked");
    });

    it("should respect custom allowed protocols", () => {
      const result = validateUrlSecurity("ftp://example.com", {
        allowedProtocols: ["ftp:"],
      });
      expect(result.isValid).toBe(true);
    });

    it("should respect custom blocked domains", () => {
      const result = validateUrlSecurity("https://evil.com", {
        blockedDomains: ["evil.com"],
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("blocked");
    });

    it("should respect allowed domains list", () => {
      const allowedResult = validateUrlSecurity("https://trusted.com", {
        allowedDomains: ["trusted.com"],
      });
      const blockedResult = validateUrlSecurity("https://untrusted.com", {
        allowedDomains: ["trusted.com"],
      });

      expect(allowedResult.isValid).toBe(true);
      expect(blockedResult.isValid).toBe(false);
    });
  });

  describe("checkUrlAccessibility", () => {
    it("should detect accessible URLs", async () => {
      const result = await checkUrlAccessibility(
        `http://localhost:${mockServerPort}/valid`,
        { allowLocal: true },
      );
      expect(result.isAccessible).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it("should detect inaccessible URLs", async () => {
      const result = await checkUrlAccessibility(
        `http://localhost:${mockServerPort}/notfound`,
        { allowLocal: true },
      );
      expect(result.isAccessible).toBe(false);
      expect(result.statusCode).toBe(404);
    });

    it("should handle redirects", async () => {
      const result = await checkUrlAccessibility(
        `http://localhost:${mockServerPort}/redirect`,
        { allowLocal: true },
      );
      expect(result.isAccessible).toBe(true);
      expect(result.finalUrl).toBe(`http://localhost:${mockServerPort}/valid`);
    });

    it("should timeout on slow responses", async () => {
      const result = await checkUrlAccessibility(
        `http://localhost:${mockServerPort}/slow`,
        {
          timeout: 1000, // 1 second timeout
          allowLocal: true,
        },
      );
      expect(result.isAccessible).toBe(false);
      expect(result.error).toBeDefined();
    }, 10000);

    it("should handle network errors", async () => {
      const result = await checkUrlAccessibility(
        "http://nonexistent-domain-12345.com",
      );
      expect(result.isAccessible).toBe(false);
      expect(result.error).toContain("Network error");
    });
  });

  describe("validateUrls", () => {
    it("should validate multiple URLs concurrently", async () => {
      const urls = [
        `http://localhost:${mockServerPort}/valid`,
        `http://localhost:${mockServerPort}/notfound`,
        "https://httpbin.org/status/200",
      ];

      const results = await validateUrls(urls, { allowLocal: true });
      expect(results.size).toBe(3);

      const validResult = results.get(
        `http://localhost:${mockServerPort}/valid`,
      );
      expect(validResult?.isAccessible).toBe(true);

      const notFoundResult = results.get(
        `http://localhost:${mockServerPort}/notfound`,
      );
      expect(notFoundResult?.isAccessible).toBe(false);
    });
  });

  describe("createSafeEmailUrl", () => {
    it("should create valid URLs with parameters", async () => {
      const result = await createSafeEmailUrl(
        "https://example.com",
        "/verify-email",
        { token: "abc123", user: "test" },
      );

      const formatValidation = validateUrlFormat(result.url);
      expect(formatValidation.isValid).toBe(true);
      expect(result.url).toBe(
        "https://example.com/verify-email?token=abc123&user=test",
      );
    });

    it("should handle base URLs with trailing slashes", async () => {
      const result = await createSafeEmailUrl(
        "https://example.com/",
        "/verify-email",
        { token: "abc123" },
      );

      expect(result.url).toBe("https://example.com/verify-email?token=abc123");
    });

    it("should handle paths without leading slashes", async () => {
      const result = await createSafeEmailUrl(
        "https://example.com",
        "verify-email",
        { token: "abc123" },
      );

      expect(result.url).toBe("https://example.com/verify-email?token=abc123");
    });

    it("should handle invalid base URLs", async () => {
      const result = await createSafeEmailUrl("not-a-url", "/verify-email", {
        token: "abc123",
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
