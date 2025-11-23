import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { logger } from "../utils/logger.js";

// Per-endpoint rate limiting configurations
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    error: "Too many authentication attempts, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(
      {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        endpoint: req.path,
        method: req.method,
      },
      "Authentication rate limit exceeded",
    );
    res.status(429).json({
      error: "Too many authentication attempts, please try again later.",
      retryAfter: "15 minutes",
    });
  },
});

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Higher limit for general API endpoints (increased for stock ticker)
  message: {
    error: "Too many API requests, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(
      {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        endpoint: req.path,
        method: req.method,
      },
      "API rate limit exceeded",
    );
    res.status(429).json({
      error: "Too many API requests, please try again later.",
      retryAfter: "15 minutes",
    });
  },
});

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit file uploads
  message: {
    error: "Too many file uploads, please try again later.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(
      {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        endpoint: req.path,
        method: req.method,
      },
      "Upload rate limit exceeded",
    );
    res.status(429).json({
      error: "Too many file uploads, please try again later.",
      retryAfter: "1 hour",
    });
  },
});

export const monitoringRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Very high limit for monitoring dashboard (refreshes every 30 seconds)
  message: {
    error: "Too many monitoring requests, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(
      {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        endpoint: req.path,
        method: req.method,
      },
      "Monitoring rate limit exceeded",
    );
    res.status(429).json({
      error: "Too many monitoring requests, please try again later.",
      retryAfter: "15 minutes",
    });
  },
});

export const adminApiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // 150 requests per window for admin endpoints
  message: {
    error: "Too many admin API requests, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(
      {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        endpoint: req.path,
        method: req.method,
      },
      "Admin API rate limit exceeded",
    );
    res.status(429).json({
      error: "Too many admin API requests, please try again later.",
      retryAfter: "15 minutes",
    });
  },
});

// Enhanced Content Security Policy
export const enhancedCSP = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for Vite in development
      "'unsafe-eval'", // Required for Vite in development
      "https://apis.google.com", // For OAuth
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for styled-components and CSS-in-JS
      "https://fonts.googleapis.com",
    ],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: [
      "'self'",
      "data:", // For base64 images
      "https:", // Allow HTTPS images
    ],
    connectSrc: [
      "'self'",
      "https://api.openweathermap.org", // Weather API
      "https://accounts.google.com", // OAuth
    ],
    frameSrc: [
      "https://accounts.google.com", // OAuth frames
    ],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    manifestSrc: ["'self'"],
    workerSrc: ["'self'"],
    upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
  },
  reportOnly: false,
};

// Security event monitoring middleware
export const securityEventMonitor = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Add request ID for correlation
  if (!req.headers["x-request-id"]) {
    req.headers["x-request-id"] =
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Monitor for suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//g, // Path traversal
    /<script/gi, // XSS attempts
    /union.*select/gi, // SQL injection
    /javascript:/gi, // JavaScript injection
  ];

  const url = req.url.toLowerCase();
  const userAgent = req.get("User-Agent") || "";

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(userAgent)) {
      logger.warn(
        {
          ip: req.ip,
          userAgent,
          url: req.url,
          method: req.method,
          pattern: pattern.source,
          correlationId: req.headers["x-request-id"],
        },
        "Suspicious request pattern detected",
      );
      break;
    }
  }

  next();
};

// Enhanced session security middleware
export const sessionSecurity = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Add security headers for session management
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Add HSTS header in production
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  next();
};
