import { Router } from "express";
import mongoose from "mongoose";
import {
  getHealthMetrics,
  getPerformanceMetrics,
} from "../middleware/performance.js";
import { logger } from "../utils/logger.js";
import { cacheMiddleware } from "../utils/simpleCache.js";

const router = Router();

// Enhanced database health check
const checkDatabaseHealth = async () => {
  try {
    const dbState = mongoose.connection.readyState;
    const stateMap = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    if (dbState === 1) {
      // Test actual database connectivity with a simple operation
      await mongoose.connection.db?.admin().ping();
      return {
        status: "UP",
        state: stateMap[dbState as keyof typeof stateMap],
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
        responseTime: Date.now(), // Simple timestamp for response time
      };
    } else {
      return {
        status: "DOWN",
        state: stateMap[dbState as keyof typeof stateMap],
        error: "Database not connected",
      };
    }
  } catch (error) {
    logger.error({ err: error }, "Database health check failed");
    return {
      status: "DOWN",
      state: "error",
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
};

// Basic health check endpoint
router.get("/health", async (_req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    const overallStatus = dbHealth.status === "UP" ? "UP" : "DOWN";

    res.status(overallStatus === "UP" ? 200 : 503).json({
      status: overallStatus,
      services: {
        database: dbHealth.status,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, "Health check failed");
    res.status(503).json({
      status: "DOWN",
      error: "Health check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

// Detailed health check with comprehensive metrics (cached for 30 seconds)
router.get("/health/detailed", cacheMiddleware(30), async (_req, res) => {
  try {
    const startTime = Date.now();
    const [dbHealth, systemMetrics, performanceMetrics] = await Promise.all([
      checkDatabaseHealth(),
      Promise.resolve(getHealthMetrics()),
      Promise.resolve(getPerformanceMetrics()),
    ]);
    const responseTime = Date.now() - startTime;

    const overallStatus = dbHealth.status === "UP" ? "healthy" : "unhealthy";

    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        database: dbHealth,
        api: {
          status: "UP",
          uptime: systemMetrics.uptime,
          nodeVersion: systemMetrics.nodeVersion,
          platform: systemMetrics.platform,
          arch: systemMetrics.arch,
          pid: systemMetrics.pid,
        },
      },
      performance: {
        totalRequests: performanceMetrics.totalRequests,
        averageResponseTime: `${performanceMetrics.averageResponseTime.toFixed(2)}ms`,
        slowRequests: performanceMetrics.slowRequests,
        errorRequests: performanceMetrics.errorRequests,
        requestsPerSecond: performanceMetrics.requestsPerSecond.toFixed(2),
        errorRate:
          performanceMetrics.totalRequests > 0
            ? `${((performanceMetrics.errorRequests / performanceMetrics.totalRequests) * 100).toFixed(2)}%`
            : "0%",
      },
      system: {
        memory: systemMetrics.memory,
        uptime: systemMetrics.uptime,
        loadAverage:
          process.platform !== "win32"
            ? (
                process as NodeJS.Process & { loadavg?: () => number[] }
              ).loadavg?.() || null
            : null,
      },
    };

    res.status(overallStatus === "healthy" ? 200 : 503).json(healthData);
  } catch (error) {
    logger.error({ err: error }, "Detailed health check failed");
    res.status(503).json({
      status: "unhealthy",
      error: "Detailed health check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

// Readiness probe for Kubernetes
router.get("/health/ready", async (_req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    const systemMetrics = getHealthMetrics();

    // Check if system is ready to serve traffic
    const isReady =
      dbHealth.status === "UP" && systemMetrics.memory.heapUsed < 400; // Less than 400MB heap usage

    res.status(isReady ? 200 : 503).json({
      ready: isReady,
      checks: {
        database: dbHealth.status === "UP",
        memory: systemMetrics.memory.heapUsed < 400,
        uptime: systemMetrics.uptime > 10, // At least 10 seconds uptime
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, "Readiness check failed");
    res.status(503).json({
      ready: false,
      error: "Readiness check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

// Liveness probe for Kubernetes
router.get("/health/live", (_req, res) => {
  // Simple liveness check - if this endpoint responds, the process is alive
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
  });
});

// Legacy health check endpoint
router.get("/health-check", (_req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
});

export default router;
