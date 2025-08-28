import nodemailer from "nodemailer";

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
    // Use structured logging instead of console.log for production
    if (process.env.NODE_ENV === "development") {
      console.log("Email sent successfully to:", options.to);
    }
  } catch (error) {
    console.error("Email service error:", error);
    throw new Error("Failed to send email");
  }
};
