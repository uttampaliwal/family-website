import { logger } from "./logger.js";
import { Request, Response, NextFunction } from "express";

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheItem<unknown>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired items every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    };

    this.cache.set(key, item);

    logger.debug(
      {
        key,
        ttlSeconds,
        cacheSize: this.cache.size,
      },
      "Cache item set",
    );
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      logger.debug({ key }, "Cache miss");
      return null;
    }

    const now = Date.now();
    const isExpired = now - item.timestamp > item.ttl;

    if (isExpired) {
      this.cache.delete(key);
      logger.debug({ key }, "Cache item expired");
      return null;
    }

    logger.debug({ key }, "Cache hit");
    return item.data as T;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug({ key }, "Cache item deleted");
    }
    return deleted;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info({ clearedItems: size }, "Cache cleared");
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    const now = Date.now();
    const isExpired = now - item.timestamp > item.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  size(): number {
    return this.cache.size;
  }

  getStats() {
    let expired = 0;
    let active = 0;
    const now = Date.now();

    for (const [, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(
        {
          cleaned,
          remaining: this.cache.size,
        },
        "Cache cleanup completed",
      );
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

// Export singleton instance
export const cache = new SimpleCache();

// Cache middleware for Express routes
export const cacheMiddleware = (ttlSeconds: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Create cache key from URL and query parameters
    const cacheKey = `${req.originalUrl || req.url}`;

    // Try to get from cache
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      logger.debug({ cacheKey }, "Serving from cache");
      return res.json(cachedData);
    }

    // Store original res.json
    const originalJson = res.json;

    // Override res.json to cache the response
    res.json = function (data: unknown) {
      // Cache successful responses only
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, ttlSeconds);
        logger.debug({ cacheKey, ttlSeconds }, "Response cached");
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};
