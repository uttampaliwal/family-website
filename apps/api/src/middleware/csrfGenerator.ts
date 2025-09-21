import {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction as ExpressNextFunction,
} from "express";
import crypto from "crypto";
import { createLogContext } from "../utils/logger.js";

// Middleware to generate and set a CSRF token if one doesn't already exist.
const generateCsrfToken = (
  req: ExpressRequest,
  res: ExpressResponse,
  next: ExpressNextFunction,
): void => {
  const logger = createLogContext("csrf.generate", {
    method: req.method,
    url: req.url,
    userAgent: req.headers["user-agent"],
  });

  // Check if the cookie already exists.
  if (!req.cookies?.["XSRF-TOKEN"]) {
    const csrfToken = crypto.randomBytes(32).toString("base64");
    // The token is sent in a cookie that client-side JavaScript can read.
    res.cookie("XSRF-TOKEN", csrfToken, {
      httpOnly: false, // client must read it
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // allows cross-site on top-level navigation
    });
    logger.debug("CSRF token generated and set in cookie");
  } else {
    logger.debug("CSRF token already exists in cookie");
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
  const logger = createLogContext("csrf.validate", {
    method: req.method,
    url: req.url,
    userAgent: req.headers["user-agent"],
  });

  logger.debug("CSRF validation middleware running");

  // CSRF validation is not needed for safe methods (e.g., GET, HEAD, OPTIONS)
  // as they should not have side effects.
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    logger.debug("Safe HTTP method, skipping CSRF validation");
    return next();
  }

  // The client must send the token from the cookie in a custom header.
  // Check both lowercase and uppercase header names for compatibility
  const clientToken = (req.headers["x-xsrf-token"] ||
    req.headers["X-XSRF-TOKEN"] ||
    req.headers["x-csrf-token"] ||
    req.headers["X-CSRF-TOKEN"]) as string | undefined;

  const cookieToken = req.cookies?.["XSRF-TOKEN"];

  logger.debug("CSRF token validation attempt");

  // 1. Validate that both tokens exist and are strings.
  if (
    !clientToken ||
    !cookieToken ||
    typeof clientToken !== "string" ||
    typeof cookieToken !== "string"
  ) {
    logger.warn("CSRF validation failed: Token missing or invalid type");
    res.status(403).json({
      message: "CSRF token is missing or invalid.",
      debug: {
        clientTokenExists: !!clientToken,
        cookieTokenExists: !!cookieToken,
        clientTokenType: typeof clientToken,
        cookieTokenType: typeof cookieToken,
      },
    });
    return;
  }

  // Try URL decoding the client token to see if that matches
  let decodedClientToken: string;
  try {
    // Check if the token is already decoded
    decodedClientToken = decodeURIComponent(clientToken);
    logger.debug("Successfully decoded client token");
  } catch {
    // If decoding fails, use the original token
    logger.debug("Token decoding failed, using original token");
    decodedClientToken = clientToken;
  }

  // 2. Use Buffer.from for timing-safe comparison.
  const clientBuffer = Buffer.from(clientToken);
  const cookieBuffer = Buffer.from(cookieToken);
  const decodedClientBuffer = Buffer.from(decodedClientToken);

  // 3. Try multiple comparison strategies

  // First, try direct comparison with the original token
  if (clientBuffer.length === cookieBuffer.length) {
    if (crypto.timingSafeEqual(clientBuffer, cookieBuffer)) {
      logger.debug("CSRF validation successful with original client token");
      return next();
    }
  }

  // Then, try with the decoded token
  if (decodedClientBuffer.length === cookieBuffer.length) {
    if (crypto.timingSafeEqual(decodedClientBuffer, cookieBuffer)) {
      logger.debug("CSRF validation successful with decoded client token");
      return next();
    }
  }

  // Finally, try with both tokens encoded
  try {
    const encodedCookieToken = encodeURIComponent(cookieToken);
    const encodedCookieBuffer = Buffer.from(encodedCookieToken);

    if (clientBuffer.length === encodedCookieBuffer.length) {
      if (crypto.timingSafeEqual(clientBuffer, encodedCookieBuffer)) {
        logger.debug("CSRF validation successful with encoded cookie token");
        return next();
      }
    }
  } catch {
    logger.debug("Cookie token encoding failed during validation");
  }

  // If all comparison strategies fail, return an error
  logger.warn(
    "CSRF validation failed: Token mismatch after all comparison strategies",
  );
  res.status(403).json({
    message: "CSRF token mismatch.",
    debug: {
      clientToken: clientToken,
      decodedClientToken: decodedClientToken,
      cookieToken: cookieToken,
      clientTokenLength: clientBuffer.length,
      cookieTokenLength: cookieBuffer.length,
    },
  });
  return;

  // CSRF Validation successful
  next();
};

// Export an array of the middleware functions.
// When used with app.use(), Express will execute them in sequence.
export const csrfProtection = [generateCsrfToken, validateCsrfToken];

// Export individual middleware functions for specific use cases
export { generateCsrfToken, validateCsrfToken };
