import { Request, Response, NextFunction } from "express";
import NodeCache from "node-cache";
import { logger } from "../utils/logger.js";

// Configure cache with TTL and performance settings
const cache = new NodeCache({
  stdTTL: 300, // Default 5 minutes
  checkperiod: 320, // Check for expired keys every 5.3 minutes
  maxKeys: 1000, // Limit memory usage
  deleteOnExpire: true,
  useClones: false, // Better performance, but be careful with object mutations
});

// Cache statistics for monitoring
const cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
};

// Cache key generator
const generateCacheKey = (req: Request, prefix: string = "default"): string => {
  const userId = req.user?.id || "anonymous";
  const method = req.method;
  const path = req.path;
  const query = JSON.stringify(req.query);

  return `${prefix}:${userId}:${method}:${path}:${query}`;
};

// Generic cache middleware
export const cacheMiddleware = (
  options: {
    ttl?: number;
    keyPrefix?: string;
    condition?: (req: Request) => boolean;
  } = {},
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip caching for non-GET requests by default
    if (req.method !== "GET") {
      return next();
    }

    // Check custom condition
    if (options.condition && !options.condition(req)) {
      return next();
    }

    const cacheKey = generateCacheKey(req, options.keyPrefix);
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      cacheStats.hits++;
      logger.debug({ cacheKey, userId: req.user?.id }, "Cache hit");

      // Set cache headers
      res.set({
        "X-Cache": "HIT",
        "X-Cache-Key": cacheKey,
      });

      res.json(cachedData);
      return;
    }

    cacheStats.misses++;
    logger.debug({ cacheKey, userId: req.user?.id }, "Cache miss");

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function (data: unknown) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, options.ttl || 300);
        cacheStats.sets++;

        logger.debug(
          {
            cacheKey,
            userId: req.user?.id,
            ttl: options.ttl || 300,
          },
          "Response cached",
        );
      }

      // Set cache headers
      res.set({
        "X-Cache": "MISS",
        "X-Cache-Key": cacheKey,
      });

      return originalJson.call(this, data);
    };

    next();
  };
};

// Specific cache middleware for different routes
export const userDataCache = cacheMiddleware({
  ttl: 600, // 10 minutes for user data
  keyPrefix: "user",
  condition: (req) => !!req.user?.id,
});

export const documentsCache = cacheMiddleware({
  ttl: 300, // 5 minutes for documents
  keyPrefix: "docs",
  condition: (req) => !!req.user?.id,
});

export const publicDataCache = cacheMiddleware({
  ttl: 900, // 15 minutes for public data
  keyPrefix: "public",
});

export const healthCheckCache = cacheMiddleware({
  ttl: 30, // 30 seconds for health checks
  keyPrefix: "health",
});

// Cache invalidation helpers
export const invalidateUserCache = (userId: string): void => {
  const keys = cache.keys();
  const userKeys = keys.filter((key) => key.includes(`user:${userId}`));

  userKeys.forEach((key) => {
    cache.del(key);
    cacheStats.deletes++;
  });

  logger.debug(
    {
      userId,
      keysDeleted: userKeys.length,
    },
    "User cache invalidated",
  );
};

export const invalidateDocumentsCache = (userId?: string): void => {
  const keys = cache.keys();
  const pattern = userId ? `docs:${userId}` : "docs:";
  const docKeys = keys.filter((key) => key.includes(pattern));

  docKeys.forEach((key) => {
    cache.del(key);
    cacheStats.deletes++;
  });

  logger.debug(
    {
      userId,
      keysDeleted: docKeys.length,
    },
    "Documents cache invalidated",
  );
};

export const clearAllCache = (): void => {
  const keyCount = cache.keys().length;
  cache.flushAll();
  cacheStats.deletes += keyCount;

  logger.info({ keysDeleted: keyCount }, "All cache cleared");
};

// Cache statistics endpoint helper
export const getCacheStats = () => {
  return {
    ...cacheStats,
    cacheSize: cache.keys().length,
    cacheMemory: process.memoryUsage(),
    hitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses) || 0,
  };
};

// Cache warming for frequently accessed data
export const warmCache = async (): Promise<void> => {
  try {
    logger.info({}, "Starting cache warm-up...");

    // Add any frequently accessed data here
    // Example: Pre-load public documents, system settings, etc.

    logger.info({}, "Cache warm-up completed");
  } catch (error) {
    logger.error(`Cache warm-up failed: ${String(error)}`);
  }
};
