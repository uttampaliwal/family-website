/**
 * HTML encode a string to prevent XSS attacks
 */
const htmlEncode = (str: string) => {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

/**
 * Sanitize input by removing HTML tags and dangerous characters
 */
export const sanitizeInput = (input: string | null | undefined): string => {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Remove HTML tags and their content completely
  const sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags and content
    .replace(/<[^>]*>/g, "") // Remove all other HTML tags
    .replace(/[<>]/g, "") // Remove any remaining angle brackets
    .trim();

  return sanitized;
};

/**
 * Sanitize HTML content while preserving safe tags
 */
export const sanitizeHtml = (html: string | null | undefined): string => {
  if (!html || typeof html !== "string") {
    return "";
  }

  // Remove dangerous tags and attributes
  const sanitized = html
    .replace(
      /<\/?(?:script|iframe|object|embed|form|input|textarea|button)[^>]*>/gi,
      "",
    )
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, ""); // Remove event handlers

  return sanitized;
};

export { htmlEncode };
