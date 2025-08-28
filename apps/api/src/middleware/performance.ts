import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

// Performance monitoring middleware
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
        },
        "Performance warning - slow request or high memory usage",
      );
    }

    // Call original end method first
    const result = originalEnd.call(this, chunk, encoding);

    // Add performance headers only if headers haven't been sent
    if (!res.headersSent) {
      try {
        res.setHeader("X-Response-Time", `${responseTime.toFixed(2)}ms`);
        res.setHeader(
          "X-Memory-Usage",
          `${(endMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        );
      } catch {
        // Headers already sent, ignore
      }
    }

    return result;
  };

  next();
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

// Health check endpoint data
export const getHealthMetrics = () => {
  const usage = process.memoryUsage();
  const uptime = process.uptime();

  return {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: Math.round(uptime),
    memory: {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
    },
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
  };
};
