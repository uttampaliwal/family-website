import {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction as ExpressNextFunction,
} from "express";
import crypto from "crypto";

// Middleware to generate and set a CSRF token if one doesn't already exist.
const generateCsrfToken = (
  req: ExpressRequest,
  res: ExpressResponse,
  next: ExpressNextFunction,
): void => {
  // Log when this middleware is hit
  console.log("[CSRF] generateCsrfToken middleware running.");

  // Check if the cookie already exists.
  if (!req.cookies?.["XSRF-TOKEN"]) {
    const csrfToken = crypto.randomBytes(32).toString("base64");
    // The token is sent in a cookie that client-side JavaScript can read.
    res.cookie("XSRF-TOKEN", csrfToken, {
      httpOnly: false, // Must be false for client-side script to access it.
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    console.log(
      "[CSRF] XSRF-TOKEN cookie generated and set:",
      csrfToken.substring(0, 10) + "...",
    );
  } else {
    console.log(
      "[CSRF] XSRF-TOKEN cookie already exists:",
      req.cookies["XSRF-TOKEN"].substring(0, 10) + "...",
    );
  }
  // Pass control to the next middleware.
  next();
};

// Middleware to validate the CSRF token on incoming requests.
const validateCsrfToken = (
  req: ExpressRequest,
  res: ExpressResponse,
  next: ExpressNextFunction,
): void => {
  // Log when this middleware is hit
  console.log("[CSRF] validateCsrfToken middleware running.", {
    method: req.method,
    url: req.url,
  });

  // CSRF validation is not needed for safe methods (e.g., GET, HEAD, OPTIONS)
  // as they should not have side effects.
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    console.log("[CSRF] Safe method, skipping validation.");
    return next();
  }

  // The client must send the token from the cookie in a custom header.
  const clientToken = req.headers["x-xsrf-token"] as string | undefined;
  const cookieToken = req.cookies?.["XSRF-TOKEN"];

  console.log("[CSRF] Received tokens for validation:", {
    clientTokenPresent: !!clientToken,
    cookieTokenPresent: !!cookieToken,
  });

  // 1. Validate that both tokens exist and are strings.
  if (
    !clientToken ||
    !cookieToken ||
    typeof clientToken !== "string" ||
    typeof cookieToken !== "string"
  ) {
    console.warn(
      "[CSRF] Validation failed: Token missing or has invalid type.",
    );
    res.status(403).json({ message: "CSRF token is missing or invalid." });
    return;
  }

  // 2. Use Buffer.from for timing-safe comparison.
  const clientBuffer = Buffer.from(clientToken);
  const cookieBuffer = Buffer.from(cookieToken);

  // 3. Check for buffer length equality before comparison to prevent a crash.
  if (clientBuffer.length !== cookieBuffer.length) {
    console.warn("[CSRF] Validation failed: Token length mismatch.");
    res.status(403).json({ message: "CSRF token mismatch." });
    return;
  }

  // 4. Perform a timing-safe comparison to prevent timing attacks.
  if (!crypto.timingSafeEqual(clientBuffer, cookieBuffer)) {
    console.warn("[CSRF] Validation failed: Token value mismatch.");
    res.status(403).json({ message: "CSRF token mismatch." });
    return;
  }

  console.log("[CSRF] Validation successful.");
  next();
};

// Export an array of the middleware functions.
// When used with app.use(), Express will execute them in sequence.
export const csrfProtection = [generateCsrfToken, validateCsrfToken];

// Export individual middleware functions for specific use cases
export { generateCsrfToken, validateCsrfToken };
