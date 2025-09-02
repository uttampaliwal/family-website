import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

// Enhanced performance monitoring middleware with metrics collection
interface PerformanceMetrics {
  totalRequests: number;
  averageResponseTime: number;
  slowRequests: number;
  errorRequests: number;
  requestsPerSecond: number;
  lastResetTime: number;
}

const performanceMetrics: PerformanceMetrics = {
  totalRequests: 0,
  averageResponseTime: 0,
  slowRequests: 0,
  errorRequests: 0,
  requestsPerSecond: 0,
  lastResetTime: Date.now(),
};

// Reset metrics every hour
setInterval(
  () => {
    const now = Date.now();
    const timeDiff = (now - performanceMetrics.lastResetTime) / 1000;
    performanceMetrics.requestsPerSecond =
      performanceMetrics.totalRequests / timeDiff;

    // Reset counters but keep RPS for the last hour
    performanceMetrics.totalRequests = 0;
    performanceMetrics.averageResponseTime = 0;
    performanceMetrics.slowRequests = 0;
    performanceMetrics.errorRequests = 0;
    performanceMetrics.lastResetTime = now;
  },
  60 * 60 * 1000,
); // Every hour

export const performanceMonitor = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  // Override res.end to capture response time and memory usage
  const originalEnd = res.end;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.end = function (chunk?: any, encoding?: any) {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();

    const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external,
    };

    // Update performance metrics
    performanceMetrics.totalRequests++;
    performanceMetrics.averageResponseTime =
      (performanceMetrics.averageResponseTime *
        (performanceMetrics.totalRequests - 1) +
        responseTime) /
      performanceMetrics.totalRequests;

    if (responseTime > 1000) {
      performanceMetrics.slowRequests++;
    }

    if (res.statusCode >= 400) {
      performanceMetrics.errorRequests++;
    }

    // Log performance metrics for slow requests or high memory usage
    if (
      responseTime > 1000 ||
      Math.abs(memoryDelta.heapUsed) > 10 * 1024 * 1024
    ) {
      // 1s or 10MB
      logger.warn(
        {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          responseTime: `${responseTime.toFixed(2)}ms`,
          memoryDelta,
          userAgent: req.get("User-Agent"),
          ip: req.ip,
          correlationId: req.headers["x-request-id"],
        },
        "Performance warning - slow request or high memory usage",
      );
    }

    // Add performance headers
    try {
      res.setHeader("X-Response-Time", `${responseTime.toFixed(2)}ms`);
      res.setHeader(
        "X-Memory-Usage",
        `${(endMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      );
      res.setHeader("X-Request-ID", req.headers["x-request-id"] || "unknown");
    } catch {
      // Headers already sent, ignore
    }

    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Export performance metrics for health checks
export const getPerformanceMetrics = (): PerformanceMetrics => ({
  ...performanceMetrics,
});

// Export system health metrics
export const getHealthMetrics = () => {
  const memoryUsage = process.memoryUsage();
  return {
    uptime: process.uptime(),
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
    },
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
  };
};

// Memory usage monitoring
export const memoryMonitor = () => {
  const interval = setInterval(
    () => {
      const usage = process.memoryUsage();
      const memoryUsageMB = {
        rss: Math.round(usage.rss / 1024 / 1024),
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024),
      };

      // Log warning if memory usage is high
      if (memoryUsageMB.heapUsed > 500) {
        // 500MB threshold
        logger.warn(
          {
            memoryUsage: memoryUsageMB,
            uptime: process.uptime(),
          },
          "High memory usage detected",
        );
      }

      // Log info every 5 minutes in development
      if (process.env.NODE_ENV === "development") {
        logger.debug(
          {
            memoryUsage: memoryUsageMB,
            uptime: Math.round(process.uptime()),
          },
          "Memory usage report",
        );
      }
    },
    5 * 60 * 1000,
  ); // Every 5 minutes

  // Clear interval on process exit
  process.on("SIGINT", () => clearInterval(interval));
  process.on("SIGTERM", () => clearInterval(interval));

  return interval;
};

// CPU usage monitoring (simplified)
export const cpuMonitor = () => {
  let lastCpuUsage = process.cpuUsage();

  const interval = setInterval(() => {
    const currentCpuUsage = process.cpuUsage(lastCpuUsage);
    const cpuPercent = {
      user: (currentCpuUsage.user / 1000000) * 100, // Convert to percentage
      system: (currentCpuUsage.system / 1000000) * 100,
    };

    if (cpuPercent.user > 80 || cpuPercent.system > 80) {
      logger.warn(
        {
          cpuUsage: cpuPercent,
          uptime: process.uptime(),
        },
        "High CPU usage detected",
      );
    }

    lastCpuUsage = process.cpuUsage();
  }, 30 * 1000); // Every 30 seconds

  // Clear interval on process exit
  process.on("SIGINT", () => clearInterval(interval));
  process.on("SIGTERM", () => clearInterval(interval));

  return interval;
};

// Duplicate function removed - using the one above
