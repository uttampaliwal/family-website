import nodemailer from "nodemailer";
import { sanitizeLog } from "./logSanitizer.js";

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
    // Sanitize HTML content to prevent XSS
    const sanitizedHtml = String(options.html || "")
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");

    await transporter.sendMail({
      from: process.env.EMAIL_USER, // Sender address
      to: options.to,
      subject: options.subject,
      html: sanitizedHtml,
    });
    const logData = {
      level: "info",
      message: "Email sent successfully",
      to: options.to.replace(/[\n\r\t]/g, ""),
      subject: options.subject.replace(/[\n\r\t]/g, ""),
      timestamp: new Date().toISOString(),
    };
    // Use structured logging instead of console.log for production
    if (process.env.NODE_ENV === "development") {
      console.log(JSON.stringify(logData));
    }
  } catch (error) {
    const errorData = {
      level: "error",
      message: "Failed to send email",
      to: options.to.replace(/[\n\r\t]/g, ""),
      subject: options.subject.replace(/[\n\r\t]/g, ""),
      error:
        error instanceof Error
          ? error.message.replace(/[\n\r\t]/g, "")
          : "Unknown error",
      timestamp: new Date().toISOString(),
    };
    console.error(sanitizeLog(JSON.stringify(errorData, null, 2)));
    console.error("Full error object:", error);
    throw new Error("Failed to send email");
  }
};
