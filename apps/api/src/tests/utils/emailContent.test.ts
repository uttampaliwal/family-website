import { describe, it, expect } from "@jest/globals";
import {
  createEmailVerificationTemplate,
  createPasswordResetTemplate,
  createPasswordChangeConfirmationTemplate,
  createDocumentShareTemplate,
} from "../../utils/emailContent.js";

describe("Email Content Templates", () => {
  const mockOptions = {
    recipientName: "John Doe",
    companyName: "Test Company",
    supportEmail: "support@test.com",
    brandColor: "#2563eb",
  };

  describe("createEmailVerificationTemplate", () => {
    it("should create a complete email verification template", () => {
      const verificationUrl = "https://example.com/verify?token=abc123";
      const template = createEmailVerificationTemplate(
        verificationUrl,
        mockOptions,
      );

      // Check subject
      expect(template.subject).toBe("Verify your email address - Test Company");

      // Check HTML content
      expect(template.html).toContain("Verify Your Email Address");
      expect(template.html).toContain("Hello John Doe");
      expect(template.html).toContain("Welcome to Test Company");
      expect(template.html).toContain(
        "https:&#x2F;&#x2F;example.com&#x2F;verify?token=abc123",
      );
      expect(template.html).toContain("Verify Email Address");
      expect(template.html).toContain("24 hours");
      expect(template.html).toContain("support@test.com");

      // Check text content
      expect(template.text).toContain("Verify Your Email Address");
      expect(template.text).toContain("Test Company");
      expect(template.text).toContain("support@test.com");

      // Check security features
      expect(template.html).toContain("Security Notice");
      expect(template.html).toContain("expire in 24 hours");
    });

    it("should handle missing options with defaults", () => {
      const verificationUrl = "https://example.com/verify?token=abc123";
      const template = createEmailVerificationTemplate(verificationUrl);

      expect(template.subject).toContain("Family Website");
      expect(template.html).toContain("Hello User");
      expect(template.html).toContain("Welcome to Family Website");
    });

    it("should properly encode HTML entities in URLs", () => {
      const verificationUrl =
        "https://example.com/verify?token=abc123&redirect=https://test.com";
      const template = createEmailVerificationTemplate(
        verificationUrl,
        mockOptions,
      );

      // URL should be HTML encoded
      expect(template.html).toContain(
        "https:&#x2F;&#x2F;example.com&#x2F;verify?token=abc123&amp;redirect=https:&#x2F;&#x2F;test.com",
      );
    });
  });

  describe("createPasswordResetTemplate", () => {
    it("should create a complete password reset template", () => {
      const resetUrl = "https://example.com/reset-password";
      const resetToken = "reset123token";
      const template = createPasswordResetTemplate(
        resetUrl,
        resetToken,
        mockOptions,
      );

      // Check subject
      expect(template.subject).toBe("Password reset request - Test Company");

      // Check HTML content
      expect(template.html).toContain("Password Reset Request");
      expect(template.html).toContain("Hello John Doe");
      expect(template.html).toContain(
        "https:&#x2F;&#x2F;example.com&#x2F;reset-password",
      );
      expect(template.html).toContain(resetToken);
      expect(template.html).toContain("Reset Password");
      expect(template.html).toContain("1 hour");
      expect(template.html).toContain("support@test.com");

      // Check text content
      expect(template.text).toContain("Password Reset Request");
      expect(template.text).toContain("Test Company");

      // Check security features
      expect(template.html).toContain("Security Information");
      expect(template.html).toContain("expires in 1 hour");
      expect(template.html).toContain("strong, unique password");
    });

    it("should include clear instructions", () => {
      const resetUrl = "https://example.com/reset-password";
      const resetToken = "reset123token";
      const template = createPasswordResetTemplate(
        resetUrl,
        resetToken,
        mockOptions,
      );

      // Check for step-by-step instructions
      expect(template.html).toContain("To reset your password:");
      expect(template.html).toContain(
        "<li>Click the reset password button below</li>",
      );
      expect(template.html).toContain(
        "<li>Enter your reset code when prompted</li>",
      );
      expect(template.html).toContain("<li>Create a new secure password</li>");
    });
  });

  describe("createPasswordChangeConfirmationTemplate", () => {
    it("should create a complete password change confirmation template", () => {
      const userEmail = "user@example.com";
      const template = createPasswordChangeConfirmationTemplate(
        userEmail,
        mockOptions,
      );

      // Check subject
      expect(template.subject).toBe("Password changed - Test Company");

      // Check HTML content
      expect(template.html).toContain("Password Changed Successfully");
      expect(template.html).toContain("Hello John Doe");
      expect(template.html).toContain(userEmail);
      expect(template.html).toContain("successfully changed");
      expect(template.html).toContain("support@test.com");

      // Check text content
      expect(template.text).toContain("Password Changed Successfully");
      expect(template.text).toContain("Test Company");

      // Check security features
      expect(template.html).toContain("Security Alert");
      expect(template.html).toContain("Security Tips");
      expect(template.html).toContain("two-factor authentication");
    });

    it("should include security tips", () => {
      const userEmail = "user@example.com";
      const template = createPasswordChangeConfirmationTemplate(
        userEmail,
        mockOptions,
      );

      expect(template.html).toContain("Keep your password secure");
      expect(template.html).toContain("unique password");
      expect(template.html).toContain("two-factor authentication");
    });
  });

  describe("createDocumentShareTemplate", () => {
    it("should create a complete document share template", () => {
      const documentTitle = "Important Document";
      const sharedByName = "Jane Smith";
      const documentUrl = "https://example.com/documents/123";
      const permission = "read";
      const message = "Please review this document";

      const template = createDocumentShareTemplate(
        documentTitle,
        sharedByName,
        documentUrl,
        permission,
        message,
        mockOptions,
      );

      // Check subject
      expect(template.subject).toBe(
        "Document shared: Important Document - Test Company",
      );

      // Check HTML content
      expect(template.html).toContain("Document Shared With You");
      expect(template.html).toContain("Hello John Doe");
      expect(template.html).toContain("Jane Smith");
      expect(template.html).toContain("Important Document");
      expect(template.html).toContain("View Only");
      expect(template.html).toContain(
        "https:&#x2F;&#x2F;example.com&#x2F;documents&#x2F;123",
      );
      expect(template.html).toContain("Please review this document");

      // Check text content
      expect(template.text).toContain("Document Shared With You");
      expect(template.text).toContain("Test Company");
    });

    it("should handle edit permissions correctly", () => {
      const template = createDocumentShareTemplate(
        "Test Doc",
        "John Smith",
        "https://example.com/doc/1",
        "write",
        undefined,
        mockOptions,
      );

      expect(template.html).toContain("Edit Access");
    });

    it("should handle missing personal message", () => {
      const template = createDocumentShareTemplate(
        "Test Doc",
        "John Smith",
        "https://example.com/doc/1",
        "read",
        undefined,
        mockOptions,
      );

      expect(template.html).not.toContain("Personal Message");
    });
  });

  describe("Email Template Structure", () => {
    it("should include consistent branding elements", () => {
      const template = createEmailVerificationTemplate(
        "https://example.com",
        mockOptions,
      );

      // Check for consistent structure
      expect(template.html).toContain("<!DOCTYPE html>");
      expect(template.html).toContain('<html lang="en">');
      expect(template.html).toContain("Test Company");
      expect(template.html).toContain("#2563eb"); // Brand color
      expect(template.html).toContain("support@test.com");
    });

    it("should include responsive design elements", () => {
      const template = createEmailVerificationTemplate(
        "https://example.com",
        mockOptions,
      );

      expect(template.html).toContain("viewport");
      expect(template.html).toContain("max-width: 600px");
      expect(template.html).toContain("font-family");
    });

    it("should include accessibility features", () => {
      const template = createEmailVerificationTemplate(
        "https://example.com",
        mockOptions,
      );

      expect(template.html).toContain('lang="en"');
      expect(template.html).not.toContain("alt="); // Should have alt text for images if any
    });

    it("should properly escape HTML content", () => {
      const maliciousOptions = {
        recipientName: '<script>alert("xss")</script>',
        companyName: "<img src=x onerror=alert(1)>",
        supportEmail: "test@example.com",
      };

      const template = createEmailVerificationTemplate(
        "https://example.com",
        maliciousOptions,
      );

      // Should not contain unescaped script tags
      expect(template.html).not.toContain("<script>");

      // Should contain escaped versions
      expect(template.html).toContain("&lt;script&gt;");
      expect(template.html).toContain("&lt;img");
    });
  });

  describe("Text Version Quality", () => {
    it("should create readable plain text versions", () => {
      const template = createEmailVerificationTemplate(
        "https://example.com/verify",
        mockOptions,
      );

      // Text should not contain HTML tags
      expect(template.text).not.toContain("<");
      expect(template.text).not.toContain(">");
      expect(template.text).not.toContain("&lt;");
      expect(template.text).not.toContain("&gt;");

      // Should contain key information
      expect(template.text).toContain("Verify Your Email Address");
      expect(template.text).toContain("Test Company");
      expect(template.text).toContain("support@test.com");
    });

    it("should maintain proper formatting in text version", () => {
      const template = createPasswordResetTemplate(
        "https://example.com/reset",
        "token123",
        mockOptions,
      );

      // Should have proper line breaks and structure
      expect(template.text).toContain("\n");
      expect(template.text.trim()).not.toBe("");

      // Should not have excessive whitespace
      expect(template.text).not.toMatch(/\s{3,}/);
    });
  });
});
