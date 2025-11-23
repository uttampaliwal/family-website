import { Router } from "express";
import {
  getHealthMetrics,
  getPerformanceMetrics,
} from "../middleware/performance.js";
import { cache } from "../utils/simpleCache.js";
import { logger } from "../utils/logger.js";
import mongoose from "mongoose";
import { protect as authMiddleware } from "../middleware/authMiddleware";
import adminOnly from "../middleware/adminMiddleware";

const router = Router();

// Apply authentication and admin-only middleware to all monitoring routes
router.use(authMiddleware);
router.use(adminOnly);

// Monitoring dashboard endpoint
router.get("/dashboard", async (_req, res) => {
  try {
    const [systemMetrics, performanceMetrics, cacheStats] = await Promise.all([
      Promise.resolve(getHealthMetrics()),
      Promise.resolve(getPerformanceMetrics()),
      Promise.resolve(cache.getStats()),
    ]);

    const dbState = mongoose.connection.readyState;
    const dbStateMap = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    const dashboardData = {
      timestamp: new Date().toISOString(),
      system: {
        status: "healthy",
        uptime: systemMetrics.uptime,
        memory: {
          ...systemMetrics.memory,
          usagePercentage: Math.round(
            (systemMetrics.memory.heapUsed / systemMetrics.memory.heapTotal) *
              100,
          ),
        },
        platform: systemMetrics.platform,
        nodeVersion: systemMetrics.nodeVersion,
        pid: systemMetrics.pid,
      },
      database: {
        status: dbState === 1 ? "connected" : "disconnected",
        state: dbStateMap[dbState as keyof typeof dbStateMap],
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      },
      performance: {
        totalRequests: performanceMetrics.totalRequests,
        averageResponseTime: Math.round(performanceMetrics.averageResponseTime),
        slowRequests: performanceMetrics.slowRequests,
        errorRequests: performanceMetrics.errorRequests,
        requestsPerSecond:
          Math.round(performanceMetrics.requestsPerSecond * 100) / 100,
        errorRate:
          performanceMetrics.totalRequests > 0
            ? Math.round(
                (performanceMetrics.errorRequests /
                  performanceMetrics.totalRequests) *
                  10000,
              ) / 100
            : 0,
        slowRequestRate:
          performanceMetrics.totalRequests > 0
            ? Math.round(
                (performanceMetrics.slowRequests /
                  performanceMetrics.totalRequests) *
                  10000,
              ) / 100
            : 0,
      },
      cache: {
        total: cacheStats.total,
        active: cacheStats.active,
        expired: cacheStats.expired,
        hitRate:
          cacheStats.total > 0
            ? Math.round((cacheStats.active / cacheStats.total) * 10000) / 100
            : 0,
      },
      alerts: generateAlerts(systemMetrics, performanceMetrics),
    };

    res.json(dashboardData);
  } catch (error) {
    logger.error({ err: error }, "Failed to generate monitoring dashboard");
    res.status(500).json({
      error: "Failed to generate monitoring dashboard",
      timestamp: new Date().toISOString(),
    });
  }
});

// Real-time metrics endpoint for live updates
router.get("/metrics", async (_req, res) => {
  try {
    const performanceMetrics = getPerformanceMetrics();
    const systemMetrics = getHealthMetrics();

    const metrics = {
      timestamp: Date.now(),
      memory: systemMetrics.memory.heapUsed,
      requests: performanceMetrics.totalRequests,
      responseTime: Math.round(performanceMetrics.averageResponseTime),
      errorRate:
        performanceMetrics.totalRequests > 0
          ? Math.round(
              (performanceMetrics.errorRequests /
                performanceMetrics.totalRequests) *
                10000,
            ) / 100
          : 0,
      rps: Math.round(performanceMetrics.requestsPerSecond * 100) / 100,
    };

    res.json(metrics);
  } catch (error) {
    logger.error({ err: error }, "Failed to get real-time metrics");
    res.status(500).json({
      error: "Failed to get metrics",
      timestamp: Date.now(),
    });
  }
});

// System alerts endpoint
router.get("/alerts", async (_req, res) => {
  try {
    const systemMetrics = getHealthMetrics();
    const performanceMetrics = getPerformanceMetrics();
    const alerts = generateAlerts(systemMetrics, performanceMetrics);

    res.json({
      alerts,
      timestamp: new Date().toISOString(),
      alertCount: alerts.length,
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to get system alerts");
    res.status(500).json({
      error: "Failed to get alerts",
      timestamp: new Date().toISOString(),
    });
  }
});

// Helper function to generate alerts based on thresholds
function generateAlerts(
  systemMetrics: ReturnType<typeof getHealthMetrics>,
  performanceMetrics: ReturnType<typeof getPerformanceMetrics>,
) {
  const alerts = [];

  // Memory usage alert (>400MB)
  if (systemMetrics.memory.heapUsed > 400) {
    alerts.push({
      type: "warning",
      category: "memory",
      message: `High memory usage: ${systemMetrics.memory.heapUsed}MB`,
      threshold: 400,
      current: systemMetrics.memory.heapUsed,
      severity: systemMetrics.memory.heapUsed > 500 ? "critical" : "warning",
    });
  }

  // Error rate alert (>5%)
  const errorRate =
    performanceMetrics.totalRequests > 0
      ? (performanceMetrics.errorRequests / performanceMetrics.totalRequests) *
        100
      : 0;

  if (errorRate > 5) {
    alerts.push({
      type: "error",
      category: "performance",
      message: `High error rate: ${errorRate.toFixed(2)}%`,
      threshold: 5,
      current: Math.round(errorRate * 100) / 100,
      severity: errorRate > 10 ? "critical" : "warning",
    });
  }

  // Slow request rate alert (>10%)
  const slowRequestRate =
    performanceMetrics.totalRequests > 0
      ? (performanceMetrics.slowRequests / performanceMetrics.totalRequests) *
        100
      : 0;

  if (slowRequestRate > 10) {
    alerts.push({
      type: "warning",
      category: "performance",
      message: `High slow request rate: ${slowRequestRate.toFixed(2)}%`,
      threshold: 10,
      current: Math.round(slowRequestRate * 100) / 100,
      severity: slowRequestRate > 20 ? "critical" : "warning",
    });
  }

  // Database connection alert
  const dbState = mongoose.connection.readyState;
  if (dbState !== 1) {
    alerts.push({
      type: "critical",
      category: "database",
      message: "Database not connected",
      threshold: "connected",
      current:
        dbState === 0
          ? "disconnected"
          : dbState === 2
            ? "connecting"
            : "disconnecting",
      severity: "critical",
    });
  }

  return alerts;
}

export default router;
