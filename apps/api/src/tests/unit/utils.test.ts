import { sanitizeInput, sanitizeHtml } from "../../utils/sanitization.js";
import { logger } from "../../utils/logger.js";

describe("Sanitization Utils", () => {
  describe("sanitizeInput", () => {
    it("should remove HTML tags from input", () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = sanitizeInput(input);
      expect(result).toBe("Hello World");
    });

    it("should handle empty input", () => {
      expect(sanitizeInput("")).toBe("");
      expect(sanitizeInput(undefined as unknown as string)).toBe("");
      expect(sanitizeInput(null as unknown as string)).toBe("");
    });

    it("should preserve safe text", () => {
      const input = "This is safe text with numbers 123";
      const result = sanitizeInput(input);
      expect(result).toBe(input);
    });

    it("should remove potentially dangerous characters", () => {
      const input = "Hello<script>World</script>";
      const result = sanitizeInput(input);
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("</script>");
    });
  });

  describe("sanitizeHtml", () => {
    it("should allow safe HTML tags", () => {
      const input = "<p>Hello <strong>World</strong></p>";
      const result = sanitizeHtml(input);
      expect(result).toContain("<p>");
      expect(result).toContain("<strong>");
    });

    it("should remove dangerous HTML tags", () => {
      const input = '<script>alert("xss")</script><p>Safe content</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain("<script>");
      expect(result).toContain("<p>");
    });

    it("should remove dangerous attributes", () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain("javascript:");
    });
  });
});

describe("Logger", () => {
  it("should be properly configured", () => {
    expect(logger).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
  });

  it("should log messages without throwing errors", () => {
    expect(() => {
      logger.info("Test info message");
      logger.error("Test error message");
      logger.warn("Test warning message");
      logger.debug("Test debug message");
    }).not.toThrow();
  });
});
