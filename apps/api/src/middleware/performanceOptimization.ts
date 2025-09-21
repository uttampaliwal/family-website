import { Request, Response, NextFunction } from "express";
import compression from "compression";
import { logger } from "../utils/logger.js";

// Enhanced compression middleware
export const enhancedCompression = compression({
  filter: (req: Request, res: Response) => {
    // Don't compress responses with this request header
    if (req.headers["x-no-compression"]) {
      return false;
    }

    // Use compression filter for everything else
    return compression.filter(req, res);
  },
  level: 6, // Good balance between compression ratio and CPU usage
  threshold: 1024, // Only compress responses larger than 1KB
  memLevel: 8, // Memory usage for compression
});

// Response time monitoring
export const responseTimeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    // Log slow requests
    if (duration > 1000) {
      logger.warn(
        {
          method: req.method,
          url: req.url || "",
          duration: `${duration}ms`,
          userAgent: req.headers["user-agent"],
          ip: req.ip,
        },
        "Slow request detected",
      );
    }

    // Add response time header
    res.set("X-Response-Time", `${duration}ms`);
  });

  next();
};

// Request deduplication middleware
const requestCache = new Map<
  string,
  { promise: Promise<unknown>; timestamp: number }
>();
const CACHE_DURATION = 1000; // 1 second

export const requestDeduplication = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Only apply to GET requests
  if (req.method !== "GET") {
    return next();
  }

  const cacheKey = `${req.method}:${req.url}:${req.user?.id || "anonymous"}`;
  const cached = requestCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    // Return cached promise
    cached.promise
      .then((data) => {
        res.json(data);
      })
      .catch(next);
    return;
  }

  // Create new promise for this request
  const promise = new Promise((resolve, reject) => {
    const originalJson = res.json;
    const originalSend = res.send;
    let resolved = false;

    res.json = function (data: unknown) {
      if (!resolved) {
        resolved = true;
        resolve(data);
      }
      return originalJson.call(this, data);
    };

    res.send = function (data: unknown) {
      if (!resolved) {
        resolved = true;
        resolve(data);
      }
      return originalSend.call(this, data);
    };

    // Handle errors
    res.on("error", (error) => {
      if (!resolved) {
        resolved = true;
        reject(error);
      }
    });

    next();
  });

  // Cache the promise
  requestCache.set(cacheKey, { promise, timestamp: Date.now() });

  // Clean up cache periodically
  setTimeout(() => {
    requestCache.delete(cacheKey);
  }, CACHE_DURATION * 2);
};

// Memory usage optimization
export const memoryOptimization = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Limit request size for specific endpoints
  const sensitiveEndpoints = [
    "/api/documents/upload",
    "/api/users/profile-picture",
  ];

  if (sensitiveEndpoints.some((endpoint) => req.path.includes(endpoint))) {
    // Add memory-conscious headers
    res.set({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
  }

  next();
};

// Database query optimization middleware
export const queryOptimization = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Add query hints for common operations
  if (req.query.search) {
    req.queryHints = {
      useIndex: "text_search",
      limit: parseInt(req.query.limit as string) || 20,
    };
  }

  if (req.query.sort) {
    req.queryHints = {
      ...req.queryHints,
      sort: String(req.query.sort),
    };
  }

  next();
};

// Static asset optimization
export const staticAssetOptimization = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Set long-term caching for static assets
  if (
    req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)
  ) {
    res.set({
      "Cache-Control": "public, max-age=31536000, immutable", // 1 year
      Expires: new Date(Date.now() + 31536000000).toUTCString(),
    });
  }

  // Set short-term caching for API responses
  if (req.path.startsWith("/api/") && req.method === "GET") {
    res.set({
      "Cache-Control": "public, max-age=300", // 5 minutes
      Vary: "Accept-Encoding, Authorization",
    });
  }

  next();
};

// Content optimization middleware
export const contentOptimization = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Add content encoding headers
  const acceptEncoding = req.headers["accept-encoding"] || "";

  if (acceptEncoding.includes("br")) {
    res.set("Content-Encoding", "br");
  } else if (acceptEncoding.includes("gzip")) {
    res.set("Content-Encoding", "gzip");
  }

  // Add performance hints
  res.set({
    "X-DNS-Prefetch-Control": "on",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
  });

  next();
};

// Request size optimization
export const requestSizeOptimization = (maxSize: string = "10mb") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers["content-length"] || "0");
    const maxBytes = parseSize(maxSize);

    if (contentLength > maxBytes) {
      res.status(413).json({
        success: false,
        message: "Request entity too large",
        maxSize,
      });
      return;
    }

    next();
  };
};

// Helper function to parse size strings
const parseSize = (size: string): number => {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);

  if (!match) {
    throw new Error(`Invalid size format: ${size}`);
  }

  const value = parseFloat(match[1]);
  const unit = (match[2] as keyof typeof units) || "b";

  return value * units[unit];
};
