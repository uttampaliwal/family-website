import nodemailer from "nodemailer";
import { logInfo, logError } from "./logger";

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
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    // Sanitize HTML content to prevent XSS while preserving safe HTML tags
    const sanitizedHtml = String(options.html || "")
      // Remove dangerous script tags
      .replace(/<script[^>]*>.*?<\/script>/gis, "")
      // Remove dangerous event handlers
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      // Remove javascript: and vbscript: protocols
      .replace(/javascript:/gi, "")
      .replace(/vbscript:/gi, "")
      // Remove data: URLs (can be used for XSS)
      .replace(/data:/gi, "")
      // Remove CSS expressions
      .replace(/expression\s*\(/gi, "");

    await transporter.sendMail({
      from: process.env.EMAIL_USER, // Sender address
      to: options.to,
      subject: options.subject,
      html: sanitizedHtml,
    });
    // Use structured logging for email notifications
    if (process.env.NODE_ENV === "development") {
      logInfo("Email sent successfully", {
        to: options.to,
        subject: options.subject,
      });
    }
  } catch (error) {
    logError(error as Error, "email_service", {
      to: options.to,
      subject: options.subject,
    });
    throw new Error("Failed to send email");
  }
};
