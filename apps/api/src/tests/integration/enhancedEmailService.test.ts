import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import {
  sendEnhancedEmail,
  sendEmailWithRetry,
} from "../../utils/enhancedEmailService.js";

// Mock nodemailer
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
  })),
}));

// Mock URL validator
jest.mock("../../utils/urlValidator.js", () => ({
  validateUrl: jest.fn(),
}));

// Mock logger
jest.mock("../../utils/logger.js", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import nodemailer from "nodemailer";
import { validateUrl } from "../../utils/urlValidator.js";
import { logger } from "../../utils/logger.js";

const mockSendMail = jest.mocked(nodemailer.createTransport().sendMail);
const mockValidateUrl = jest.mocked(validateUrl);
const mockLogger = jest.mocked(logger);

describe("Enhanced Email Service Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default successful email sending
    mockSendMail.mockResolvedValue({
      messageId: "test-message-id",
      response: "250 OK",
    });

    // Default successful URL validation
    mockValidateUrl.mockResolvedValue({
      isValid: true,
      isAccessible: true,
      statusCode: 200,
      responseTime: 100,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("sendEnhancedEmail", () => {
    const validEmailOptions = {
      to: "test@example.com",
      subject: "Test Subject",
      html: '<p>Test content with <a href="https://example.com">link</a></p>',
      text: "Test content with link",
    };

    it("should send email successfully with URL validation", async () => {
      const result = await sendEnhancedEmail(validEmailOptions);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("test-message-id");
      expect(result.urlValidationResults).toBeDefined();
      expect(mockSendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_USER,
        to: "test@example.com",
        subject: "Test Subject",
        html: expect.stringContaining("Test content"),
        text: "Test content with link",
      });
    });

    it("should validate URLs in email content", async () => {
      await sendEnhancedEmail(validEmailOptions);

      expect(mockValidateUrl).toHaveBeenCalledWith(
        "https://example.com",
        expect.objectContaining({
          timeout: 5000,
        }),
      );
    });

    it("should handle URL validation failures gracefully", async () => {
      mockValidateUrl.mockResolvedValue({
        isValid: true,
        isAccessible: false,
        error: "Connection timeout",
        responseTime: 5000,
      });

      const result = await sendEnhancedEmail(validEmailOptions);

      expect(result.success).toBe(true); // Should still send email
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Email contains inaccessible URLs",
        expect.any(Object),
      );
    });

    it("should skip URL validation when disabled", async () => {
      const options = {
        ...validEmailOptions,
        validateUrls: false,
      };

      await sendEnhancedEmail(options);

      expect(mockValidateUrl).not.toHaveBeenCalled();
    });

    it("should sanitize HTML content", async () => {
      const maliciousHtml = `
        <p>Safe content</p>
        <script>alert('xss')</script>
        <a href="javascript:alert('xss')">Link</a>
        <div onclick="alert('xss')">Click me</div>
        <img src="data:image/png;base64,abc" />
      `;

      const options = {
        ...validEmailOptions,
        html: maliciousHtml,
        validateUrls: false,
      };

      await sendEnhancedEmail(options);

      const sentHtml = mockSendMail.mock.calls[0][0].html;
      expect(sentHtml).not.toContain("<script>");
      expect(sentHtml).not.toContain("javascript:");
      expect(sentHtml).not.toContain("onclick=");
      expect(sentHtml).not.toContain("data:");
    });

    it("should handle missing required options", async () => {
      const invalidOptions = {
        to: "",
        subject: "Test",
        html: "<p>Test</p>",
      };

      const result = await sendEnhancedEmail(invalidOptions);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Missing required email options");
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it("should handle email sending failures", async () => {
      mockSendMail.mockRejectedValue(new Error("SMTP connection failed"));

      const result = await sendEnhancedEmail(validEmailOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBe("SMTP connection failed");
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Email sending failed",
        expect.objectContaining({
          error: "SMTP connection failed",
        }),
      );
    });

    it("should extract and validate multiple URLs", async () => {
      const htmlWithMultipleUrls = `
        <p>Check out these links:</p>
        <a href="https://example.com">Example</a>
        <a href="https://google.com">Google</a>
        <a href="mailto:test@example.com">Email</a>
        <a href="tel:+1234567890">Phone</a>
      `;

      const options = {
        ...validEmailOptions,
        html: htmlWithMultipleUrls,
      };

      await sendEnhancedEmail(options);

      // Should validate HTTP/HTTPS URLs only
      expect(mockValidateUrl).toHaveBeenCalledTimes(2);
      expect(mockValidateUrl).toHaveBeenCalledWith(
        "https://example.com",
        expect.any(Object),
      );
      expect(mockValidateUrl).toHaveBeenCalledWith(
        "https://google.com",
        expect.any(Object),
      );
    });

    it("should use custom URL validation timeout", async () => {
      const options = {
        ...validEmailOptions,
        urlValidationTimeout: 3000,
      };

      await sendEnhancedEmail(options);

      expect(mockValidateUrl).toHaveBeenCalledWith(
        "https://example.com",
        expect.objectContaining({
          timeout: 3000,
        }),
      );
    });

    it("should log successful email sending", async () => {
      await sendEnhancedEmail(validEmailOptions);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Email sent successfully",
        expect.objectContaining({
          to: "test@example.com",
          subject: "Test Subject",
          messageId: "test-message-id",
        }),
      );
    });
  });

  describe("sendEmailWithRetry", () => {
    const validEmailOptions = {
      to: "test@example.com",
      subject: "Test Subject",
      html: "<p>Test content</p>",
      validateUrls: false,
    };

    it("should succeed on first attempt", async () => {
      const result = await sendEmailWithRetry(validEmailOptions, 3, 100);

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure and eventually succeed", async () => {
      mockSendMail
        .mockRejectedValueOnce(new Error("Temporary failure"))
        .mockRejectedValueOnce(new Error("Another failure"))
        .mockResolvedValueOnce({
          messageId: "success-message-id",
          response: "250 OK",
        });

      const result = await sendEmailWithRetry(validEmailOptions, 3, 10);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("success-message-id");
      expect(mockSendMail).toHaveBeenCalledTimes(3);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Email sent successfully after retry",
        expect.objectContaining({
          attempt: 3,
        }),
      );
    });

    it("should fail after max retries", async () => {
      mockSendMail.mockRejectedValue(new Error("Persistent failure"));

      const result = await sendEmailWithRetry(validEmailOptions, 2, 10);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed after 2 attempts");
      expect(mockSendMail).toHaveBeenCalledTimes(2);
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Email sending failed after all retries",
        expect.objectContaining({
          maxRetries: 2,
        }),
      );
    });

    it("should log retry attempts", async () => {
      mockSendMail
        .mockRejectedValueOnce(new Error("First failure"))
        .mockResolvedValueOnce({
          messageId: "success-message-id",
          response: "250 OK",
        });

      await sendEmailWithRetry(validEmailOptions, 3, 10);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Email sending failed, retrying",
        expect.objectContaining({
          attempt: 1,
          maxRetries: 3,
          error: "First failure",
        }),
      );
    });

    it("should use exponential backoff", async () => {
      const startTime = Date.now();

      mockSendMail
        .mockRejectedValueOnce(new Error("First failure"))
        .mockRejectedValueOnce(new Error("Second failure"))
        .mockResolvedValueOnce({
          messageId: "success-message-id",
          response: "250 OK",
        });

      await sendEmailWithRetry(validEmailOptions, 3, 50);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have waited at least 50ms + 100ms (exponential backoff)
      expect(duration).toBeGreaterThan(140);
    });
  });

  describe("Error Handling", () => {
    it("should handle URL validation errors gracefully", async () => {
      mockValidateUrl.mockRejectedValue(
        new Error("URL validation service down"),
      );

      const options = {
        to: "test@example.com",
        subject: "Test",
        html: '<a href="https://example.com">Link</a>',
      };

      const result = await sendEnhancedEmail(options);

      expect(result.success).toBe(true); // Should still send email
      expect(mockLogger.error).toHaveBeenCalledWith(
        "URL validation error",
        expect.objectContaining({
          error: "URL validation service down",
        }),
      );
    });

    it("should handle malformed HTML gracefully", async () => {
      const options = {
        to: "test@example.com",
        subject: "Test",
        html: "<p>Unclosed paragraph<div>Nested incorrectly</p></div>",
        validateUrls: false,
      };

      const result = await sendEnhancedEmail(options);

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalled();
    });
  });

  describe("Performance", () => {
    it("should complete email sending within reasonable time", async () => {
      const startTime = Date.now();

      await sendEnhancedEmail({
        to: "test@example.com",
        subject: "Performance Test",
        html: "<p>Quick test</p>",
        validateUrls: false,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should validate URLs concurrently", async () => {
      const htmlWithManyUrls = Array.from(
        { length: 5 },
        (_, i) => `<a href="https://example${i}.com">Link ${i}</a>`,
      ).join("");

      const startTime = Date.now();

      await sendEnhancedEmail({
        to: "test@example.com",
        subject: "Concurrent Test",
        html: htmlWithManyUrls,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete faster than sequential validation
      expect(duration).toBeLessThan(2000);
      expect(mockValidateUrl).toHaveBeenCalledTimes(5);
    });
  });
});
