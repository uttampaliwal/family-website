import nodemailer from "nodemailer";
import { validateUrl, UrlValidationResult } from "./urlValidator.js";
import { logger } from "./logger.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your Gmail app password
  },
  secure: true, // Use TLS
  requireTLS: true, // Require TLS connection
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  validateUrls?: boolean;
  urlValidationTimeout?: number;
}

interface EmailSendResult {
  success: boolean;
  messageId?: string;
  urlValidationResults?: Map<string, UrlValidationResult>;
  error?: string;
}

/**
 * Extracts URLs from HTML content
 */
function extractUrlsFromHtml(html: string): string[] {
  const urlRegex = /href\s*=\s*["']([^"']+)["']/gi;
  const urls: string[] = [];
  let match;

  while ((match = urlRegex.exec(html)) !== null) {
    const url = match[1];
    // Only include http/https URLs, skip mailto, tel, etc.
    if (url.startsWith("http://") || url.startsWith("https://")) {
      urls.push(url);
    }
  }

  return [...new Set(urls)]; // Remove duplicates
}

/**
 * Validates all URLs in email content
 */
async function validateEmailUrls(
  html: string,
  timeout: number = 5000,
): Promise<Map<string, UrlValidationResult>> {
  const urls = extractUrlsFromHtml(html);
  const results = new Map<string, UrlValidationResult>();

  if (urls.length === 0) {
    return results;
  }

  logger.info("Validating URLs in email content", {
    urlCount: urls.length,
    urls,
  });

  // Validate URLs concurrently with timeout
  const validationPromises = urls.map(async (url) => {
    try {
      const result = await validateUrl(url, {
        timeout,
        // In production, you might want to restrict to your own domains
        allowedDomains:
          process.env.NODE_ENV === "production"
            ? [new URL(process.env.FRONTEND_URL || "").hostname]
            : [], // Allow all domains in development
      });
      results.set(url, result);

      if (!result.isAccessible) {
        logger.warn("URL validation failed", { url, error: result.error });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      results.set(url, {
        isValid: false,
        isAccessible: false,
        error: errorMessage,
      });
      logger.error("URL validation error", { url, error: errorMessage });
    }
  });

  await Promise.allSettled(validationPromises);
  return results;
}

/**
 * Enhanced email sending with URL validation and better error handling
 */
export const sendEnhancedEmail = async (
  options: EmailOptions,
): Promise<EmailSendResult> => {
  const startTime = Date.now();

  try {
    // Validate email options
    if (!options.to || !options.subject || !options.html) {
      throw new Error(
        "Missing required email options: to, subject, and html are required",
      );
    }

    // Validate URLs if requested
    let urlValidationResults: Map<string, UrlValidationResult> | undefined;
    if (options.validateUrls !== false) {
      // Default to true
      urlValidationResults = await validateEmailUrls(
        options.html,
        options.urlValidationTimeout || 5000,
      );

      // Check if any critical URLs failed validation
      const failedUrls = Array.from(urlValidationResults.entries()).filter(
        ([_, result]) => !result.isAccessible,
      );

      if (failedUrls.length > 0) {
        logger.warn("Email contains inaccessible URLs", {
          failedUrls: failedUrls.map(([url, result]) => ({
            url,
            error: result.error,
          })),
        });

        // In strict mode, you might want to throw an error here
        // throw new Error(`Email contains inaccessible URLs: ${failedUrls.map(([url]) => url).join(', ')}`);
      }
    }

    // Sanitize HTML content to prevent XSS (improved sanitization)
    const sanitizedHtml = String(options.html || "")
      .replace(/<script[^>]*>.*?<\/script>/gis, "") // Case-insensitive, multiline
      .replace(/javascript:/gi, "")
      .replace(/vbscript:/gi, "")
      .replace(/on\w+\s*=/gi, "") // Remove event handlers
      .replace(/data:/gi, "") // Remove data URLs
      .replace(/expression\s*\(/gi, ""); // Remove CSS expressions

    // Prepare email data
    const emailData: nodemailer.SendMailOptions = {
      from: process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: sanitizedHtml,
    };

    // Add text version if provided
    if (options.text) {
      emailData.text = options.text;
    }

    // Send email
    const info = await transporter.sendMail(emailData);

    const duration = Date.now() - startTime;

    logger.info("Email sent successfully", {
      to: options.to,
      subject: options.subject,
      messageId: info.messageId,
      duration,
      urlCount: urlValidationResults?.size || 0,
    });

    return {
      success: true,
      messageId: info.messageId,
      urlValidationResults,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    logger.error("Email sending failed", {
      to: options.to,
      subject: options.subject,
      error: errorMessage,
      duration,
    });

    return {
      success: false,
      error: errorMessage,
      urlValidationResults,
    };
  }
};

/**
 * Sends email with automatic retry logic
 */
export const sendEmailWithRetry = async (
  options: EmailOptions,
  maxRetries: number = 3,
  retryDelay: number = 1000,
): Promise<EmailSendResult> => {
  let lastError: string = "";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await sendEnhancedEmail(options);

      if (result.success) {
        if (attempt > 1) {
          logger.info("Email sent successfully after retry", {
            attempt,
            to: options.to,
            subject: options.subject,
          });
        }
        return result;
      }

      lastError = result.error || "Unknown error";

      if (attempt < maxRetries) {
        logger.warn("Email sending failed, retrying", {
          attempt,
          maxRetries,
          error: lastError,
          nextRetryIn: retryDelay * attempt,
        });

        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * attempt),
        );
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown error";

      if (attempt < maxRetries) {
        logger.warn("Email sending failed, retrying", {
          attempt,
          maxRetries,
          error: lastError,
          nextRetryIn: retryDelay * attempt,
        });

        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * attempt),
        );
      }
    }
  }

  logger.error("Email sending failed after all retries", {
    maxRetries,
    finalError: lastError,
    to: options.to,
    subject: options.subject,
  });

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts: ${lastError}`,
  };
};
