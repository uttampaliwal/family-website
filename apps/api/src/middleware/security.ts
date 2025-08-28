import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/environment.js";
import { logger } from "../utils/logger.js";

// Enhanced rate limiting with different tiers
export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs || env.RATE_LIMIT_WINDOW_MS,
    max: options.max || env.RATE_LIMIT_MAX_REQUESTS,
    message: {
      error: "Too many requests",
      message:
        options.message ||
        "Too many requests from this IP, please try again later.",
      retryAfter: Math.ceil(
        (options.windowMs || env.RATE_LIMIT_WINDOW_MS) / 1000,
      ),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    handler: (req: Request, res: Response) => {
      logger.warn(
        {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          url: req.url,
          method: req.method,
        },
        "Rate limit exceeded",
      );

      res.status(429).json({
        error: "Too many requests",
        message:
          options.message ||
          "Too many requests from this IP, please try again later.",
        retryAfter: Math.ceil(
          (options.windowMs || env.RATE_LIMIT_WINDOW_MS) / 1000,
        ),
      });
    },
  });
};

// General API rate limiter
export const generalRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: "Too many API requests from this IP, please try again later.",
});

// Strict rate limiter for authentication endpoints
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message:
    "Too many authentication attempts from this IP, please try again later.",
  skipSuccessfulRequests: true,
});

// Very strict rate limiter for password reset
export const passwordResetRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message:
    "Too many password reset attempts from this IP, please try again later.",
  skipSuccessfulRequests: true,
});

// Speed limiter to slow down repeated requests
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per window at full speed
  delayMs: (hits) => hits * 100, // Add 100ms delay per request after delayAfter
  maxDelayMs: 5000, // Maximum delay of 5 seconds
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  // onLimitReached callback removed due to type compatibility
});

// Security headers middleware
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Additional security headers beyond helmet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.setHeader("X-Request-ID", (req as any).id || "unknown");
  res.setHeader("X-API-Version", "1.0.0");

  // Prevent caching of sensitive endpoints
  if (req.path.includes("/auth/") || req.path.includes("/user/")) {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  next();
};

// Request ID middleware for tracing
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id =
    req.get("X-Request-ID") ||
    req.get("X-Correlation-ID") ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  (req as unknown as { id: string }).id = id;
  res.setHeader("X-Request-ID", String(id));

  next();
};

// IP whitelist middleware (for admin endpoints if needed)
export const createIPWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP =
      req.ip ||
      (req as unknown as { connection?: { remoteAddress?: string } }).connection
        ?.remoteAddress;

    if (!clientIP || !allowedIPs.includes(clientIP)) {
      logger.warn(
        {
          ip: clientIP,
          url: req.url,
          method: req.method,
          userAgent: req.get("User-Agent"),
        },
        "IP not in whitelist",
      );

      return res.status(403).json({
        error: "Forbidden",
        message: "Access denied from this IP address",
      });
    }

    return next();
  };
};

// Request size limiter
export const requestSizeLimiter = (maxSize: string = "10mb") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get("Content-Length");

    if (contentLength) {
      const sizeInBytes = parseInt(contentLength, 10);
      const maxSizeInBytes = parseSize(maxSize);

      if (sizeInBytes > maxSizeInBytes) {
        logger.warn(
          {
            ip: req.ip,
            url: req.url,
            method: req.method,
            contentLength: sizeInBytes,
            maxAllowed: maxSizeInBytes,
          },
          "Request size exceeds limit",
        );

        return res.status(413).json({
          error: "Payload Too Large",
          message: `Request size exceeds the maximum allowed size of ${maxSize}`,
        });
      }
    }

    return next();
  };
};

// Helper function to parse size strings like '10mb', '1gb', etc.
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) {
    throw new Error(`Invalid size format: ${size}`);
  }

  const value = parseFloat(match[1]);
  const unit = match[2] || "b";

  return value * units[unit];
}
