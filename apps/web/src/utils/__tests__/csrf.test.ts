import { describe, it, expect, vi, beforeEach } from "vitest";
import { ensureCsrfToken, getCsrfToken } from "../csrf";

// Mock axios
const mockGet = vi.fn();
vi.mock("../../services/axios", () => ({
  default: {
    get: mockGet,
  },
}));

// Mock document.cookie
Object.defineProperty(document, "cookie", {
  writable: true,
  value: "",
});

describe("CSRF Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.cookie = "";
  });

  describe("getCsrfToken", () => {
    it("should return null when no CSRF token exists", () => {
      document.cookie = "other=value";

      const token = getCsrfToken();

      expect(token).toBeNull();
    });

    it("should return CSRF token when it exists", () => {
      document.cookie = "XSRF-TOKEN=test-token-123; other=value";

      const token = getCsrfToken();

      expect(token).toBe("test-token-123");
    });

    it("should decode URL-encoded CSRF token", () => {
      const encodedToken = encodeURIComponent("test+token=123");
      document.cookie = `XSRF-TOKEN=${encodedToken}; other=value`;

      const token = getCsrfToken();

      expect(token).toBe("test+token=123");
    });

    it("should handle empty CSRF token", () => {
      document.cookie = "XSRF-TOKEN=; other=value";

      const token = getCsrfToken();

      expect(token).toBe("");
    });
  });

  describe("ensureCsrfToken", () => {
    it("should not make request when valid token already exists", async () => {
      document.cookie = "XSRF-TOKEN=existing-token";

      await ensureCsrfToken();

      expect(mockGet).not.toHaveBeenCalled();
    });

    it("should make request when no token exists", async () => {
      document.cookie = "";
      mockGet.mockResolvedValue({
        data: { message: "CSRF token generated" },
      });

      // Mock document.cookie to simulate server setting the cookie
      setTimeout(() => {
        document.cookie = "XSRF-TOKEN=new-token-123";
      }, 0);

      await ensureCsrfToken();

      expect(mockGet).toHaveBeenCalledWith("/api/auth/csrf-token");
    });

    it("should make request when token is empty", async () => {
      document.cookie = "XSRF-TOKEN=";
      mockGet.mockResolvedValue({
        data: { message: "CSRF token generated" },
      });

      await ensureCsrfToken();

      expect(mockGet).toHaveBeenCalledWith("/api/auth/csrf-token");
    });

    it("should handle CSRF token generation failure", async () => {
      document.cookie = "";
      mockGet.mockRejectedValue(new Error("Network error"));

      await expect(ensureCsrfToken()).rejects.toThrow(
        "Failed to initialize CSRF protection",
      );
    });

    it("should warn when token is not set after generation", async () => {
      document.cookie = "";
      mockGet.mockResolvedValue({
        data: { message: "CSRF token generated" },
      });

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      await ensureCsrfToken();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "CSRF token not found in cookies after generation",
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle URL-encoded existing token", async () => {
      const token = "test+token=123";
      const encodedToken = encodeURIComponent(token);
      document.cookie = `XSRF-TOKEN=${encodedToken}`;

      await ensureCsrfToken();

      expect(mockGet).not.toHaveBeenCalled();
    });

    it("should generate token when existing token is malformed", async () => {
      document.cookie = "XSRF-TOKEN=%"; // Invalid URL encoding
      mockGet.mockResolvedValue({
        data: { message: "CSRF token generated" },
      });

      await ensureCsrfToken();

      expect(mockGet).toHaveBeenCalledWith("/api/auth/csrf-token");
    });
  });

  describe("Token lifecycle", () => {
    it("should handle complete token generation cycle", async () => {
      // Start with no token
      document.cookie = "";

      // Mock API response
      mockGet.mockResolvedValue({
        data: { message: "CSRF token generated" },
      });

      // Simulate server setting cookie after API call
      const originalGet = mockGet;
      mockGet.mockImplementation((...args) => {
        setTimeout(() => {
          document.cookie = "XSRF-TOKEN=generated-token-456";
        }, 10);
        return originalGet(...args);
      });

      await ensureCsrfToken();

      expect(mockGet).toHaveBeenCalledWith("/api/auth/csrf-token");

      // Subsequent call should not make another request
      mockGet.mockClear();
      await ensureCsrfToken();
      expect(mockGet).not.toHaveBeenCalled();
    });
  });
});
