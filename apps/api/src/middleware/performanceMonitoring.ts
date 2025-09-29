import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  memoryUsage: NodeJS.MemoryUsage;
  timestamp: Date;
  adminId?: string;
  operation?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics in memory

  addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(limit = 100) {
    return this.metrics.slice(-limit);
  }

  getAdminMetrics(adminId: string, limit = 50) {
    return this.metrics.filter((m) => m.adminId === adminId).slice(-limit);
  }

  getSlowQueries(threshold = 1000) {
    return this.metrics
      .filter((m) => m.duration > threshold)
      .sort((a, b) => b.duration - a.duration);
  }

  getAverageResponseTime(endpoint?: string) {
    const relevantMetrics = endpoint
      ? this.metrics.filter((m) => m.endpoint === endpoint)
      : this.metrics;

    if (relevantMetrics.length === 0) return 0;

    const total = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / relevantMetrics.length;
  }

  getErrorRate(timeRange = 3600000) {
    // Default 1 hour
    const now = Date.now();
    const recentMetrics = this.metrics.filter(
      (m) => now - m.timestamp.getTime() < timeRange,
    );

    if (recentMetrics.length === 0) return 0;

    const errorCount = recentMetrics.filter((m) => m.statusCode >= 400).length;
    return (errorCount / recentMetrics.length) * 100;
  }

  getMemoryTrends() {
    const recentMetrics = this.metrics.slice(-50);
    return recentMetrics.map((m) => ({
      timestamp: m.timestamp,
      heapUsed: m.memoryUsage.heapUsed,
      heapTotal: m.memoryUsage.heapTotal,
      external: m.memoryUsage.external,
    }));
  }

  clearMetrics() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Performance monitoring middleware for admin operations
 */
export const adminPerformanceMiddleware = (operation?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();

    // Override res.end to capture metrics
    const originalEnd = res.end;
    res.end = function (this: Response, ...args: unknown[]) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      const endMemory = process.memoryUsage();

      const metric: PerformanceMetrics = {
        endpoint: req.path,
        method: req.method,
        duration,
        statusCode: res.statusCode,
        memoryUsage: endMemory,
        timestamp: new Date(),
        adminId: req.user?._id?.toString(),
        operation: operation || req.path.split("/").pop(),
      };

      performanceMonitor.addMetric(metric);

      // Log slow admin operations
      if (duration > 1000) {
        logger.warn(
          {
            ...metric,
            memoryDelta: {
              heapUsed: endMemory.heapUsed - startMemory.heapUsed,
              heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            },
          },
          "Slow admin operation detected",
        );
      }

      // Log memory leaks
      if (endMemory.heapUsed > startMemory.heapUsed * 1.5) {
        logger.warn(
          {
            ...metric,
            memoryDelta: {
              heapUsed: endMemory.heapUsed - startMemory.heapUsed,
              heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            },
          },
          "Potential memory leak in admin operation",
        );
      }

      return (originalEnd as (...args: unknown[]) => Response).apply(
        this,
        args,
      );
    };

    next();
  };
};

/**
 * Database query performance tracking
 */
export const trackDbQuery = async <T>(
  operation: string,
  query: () => Promise<T>,
  adminId?: string,
): Promise<T> => {
  const startTime = process.hrtime.bigint();

  try {
    const result = await query();
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;

    // Log slow database queries
    if (duration > 500) {
      logger.warn(
        {
          operation,
          duration,
          adminId,
          memoryUsage: process.memoryUsage(),
          type: "slow_db_query",
        },
        "Slow database query detected",
      );
    }

    return result;
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;

    logger.error(
      {
        operation,
        duration,
        adminId,
        error: error instanceof Error ? error.message : "Unknown error",
        type: "db_query_error",
      },
      "Database query failed",
    );

    throw error;
  }
};

/**
 * Performance analytics endpoint
 */
export const getPerformanceMetrics = (req: Request, res: Response) => {
  try {
    const { limit, adminId, slow } = req.query;

    let metrics;
    if (adminId) {
      metrics = performanceMonitor.getAdminMetrics(
        adminId as string,
        Number(limit) || 50,
      );
    } else if (slow === "true") {
      metrics = performanceMonitor.getSlowQueries(Number(limit) || 1000);
    } else {
      metrics = performanceMonitor.getMetrics(Number(limit) || 100);
    }

    const analytics = {
      metrics,
      summary: {
        totalRequests: performanceMonitor.getMetrics().length,
        averageResponseTime: performanceMonitor.getAverageResponseTime(),
        errorRate: performanceMonitor.getErrorRate(),
        memoryTrends: performanceMonitor.getMemoryTrends(),
      },
    };

    res.json(analytics);
  } catch (error) {
    logger.error({ error }, "Failed to get performance metrics");
    res.status(500).json({ message: "Failed to get performance metrics" });
  }
};

export default adminPerformanceMiddleware;
