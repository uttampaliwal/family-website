import express, { Express } from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";

// Import configuration and utilities
import { env } from "./config/environment.js";
import { logger, httpLogger } from "./utils/logger.js";

// Import routes
import authRoutes from "./routes/auth.js";
import feedRoutes from "./routes/feed.js";
import docsRoutes from "./routes/docs.js";
import healthRoutes from "./routes/health.js";
import documentRoutes from "./routes/documents.js";
import socialRoutes from "./routes/social.js";
import chatRoutes from "./routes/chat.js";
import calendarRoutes from "./routes/calendar.js";
import notificationsRoutes from "./routes/notifications.js";
import weatherRoutes from "./routes/weather.js";
import adminRoutes from "./routes/admin.js";
import policyRoutes from "./routes/policy.js";
import monitoringRoutes from "./routes/monitoring.js";
import passport from "./config/passport.js";

// Import middleware
import { errorHandler } from "./middleware/errorHandler.js";
// Performance middleware available for advanced setups

import {
  securityHeaders,
  requestId,
  requestSizeLimiter,
  speedLimiter,
  generalRateLimit,
  adminApiRateLimit,
} from "./middleware/security.js";
import {
  memoryMonitor,
  cpuMonitor,
  performanceMonitor,
} from "./middleware/performance.js";
import {
  enhancedCSP,
  securityEventMonitor,
  sessionSecurity,
  authRateLimit,
  apiRateLimit,
  monitoringRateLimit,
} from "./middleware/enhancedSecurity.js";

// --- 1. Environment Setup ---
// Environment validation is now handled in ./config/environment.js

// --- 2. Database Connection ---

// Enhanced Mongoose event listeners with structured logging
mongoose.connection.on("connected", () => {
  logger.info("MongoDB connection established");
});

mongoose.connection.on("error", (err) => {
  logger.error({ err }, "MongoDB connection error");
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected - attempting to reconnect");
});

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconnected successfully");
});

// Graceful handling of MongoDB connection issues
mongoose.connection.on("close", () => {
  logger.info("MongoDB connection closed");
});

// --- 3. Express Application Setup ---
const app: Express = express();

// Trust proxy settings for proper IP detection behind reverse proxies
app.set("trust proxy", 1);

// Request ID and HTTP logging (should be first)
app.use(requestId);
app.use(httpLogger);

// Performance monitoring - re-enabled with optimizations
app.use(performanceMonitor);

// Compression middleware for better performance - optimized configuration

app.use(
  compression({
    level: 6, // Balanced compression level (1-9, 6 is good balance)
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
      // Don't compress if client explicitly requests no compression
      if (req.headers["x-no-compression"]) {
        return false;
      }
      // Don't compress images, videos, or already compressed content
      const contentType = res.getHeader("Content-Type");
      if (typeof contentType === "string") {
        if (
          contentType.includes("image/") ||
          contentType.includes("video/") ||
          contentType.includes("application/zip") ||
          contentType.includes("application/gzip")
        ) {
          return false;
        }
      }
      return compression.filter(req, res);
    },
    // Add compression ratio monitoring
    chunkSize: 16 * 1024, // 16KB chunks for better streaming
  }),
);

// Re-enable the original CORS library with correct configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without origin (mobile apps, curl)
      if (!origin) return callback(null, true);

      // Support comma-separated env of allowed origins
      const configured = (env.FRONTEND_URL || "")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);

      const isConfiguredAllowed = configured.includes(origin);

      // Allow localhost:5173 and 127.0.0.1:5173
      const isLocalDev =
        /^(http:\/\/localhost:5173|http:\/\/127\.0\.0\.1:5173)$/i.test(origin);

      // Allow any LAN IPv4 at port 5173, e.g., http://192.168.x.y:5173
      const isLanDev = /^http:\/\/\d{1,3}(?:\.\d{1,3}){3}:5173$/i.test(origin);

      if (isConfiguredAllowed || isLocalDev || isLanDev) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: Origin not allowed: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-CSRF-Token",
      "X-XSRF-TOKEN",
      "x-xsrf-token",
      "Accept",
      "Cache-Control",
    ],
    exposedHeaders: ["X-Request-ID"],
    optionsSuccessStatus: 200,
  }),
);

// Enhanced security middleware (moved after CORS)
app.use(
  helmet({
    contentSecurityPolicy: enhancedCSP,
    crossOriginEmbedderPolicy: false, // Disable for API
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// Additional security monitoring and session security
app.use(securityEventMonitor);
app.use(sessionSecurity);

app.use(securityHeaders);
app.use(requestSizeLimiter("50mb")); // Limit request size

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Passport middleware
app.use(passport.initialize());

// Rate limiting and speed limiting - re-enabled with optimized configuration
app.use(speedLimiter);
app.use(generalRateLimit);

// Health check route (before CSRF protection)
app.use("/api", healthRoutes);

// Simple test route for debugging
app.get("/api/test", (req, res) => {
  logger.info("Test route accessed");
  res.json({ message: "API is working", timestamp: new Date().toISOString() });
});

// CSRF protection for state-changing operations
// Removed global CSRF protection - now applied per route for better control

// API routes with enhanced logging and per-endpoint rate limiting
app.use("/api/auth", authRateLimit, authRoutes);
app.use("/api/feed", apiRateLimit, feedRoutes);
app.use("/api/documents", apiRateLimit, documentRoutes);
app.use("/api/social", apiRateLimit, socialRoutes);
app.use("/api/chat", apiRateLimit, chatRoutes);
app.use("/api/calendar", apiRateLimit, calendarRoutes);
app.use("/api/notifications", apiRateLimit, notificationsRoutes);
app.use("/api/weather", apiRateLimit, weatherRoutes);
app.use("/api/admin", adminApiRateLimit, adminRoutes); // Admin routes get appropriate limits
app.use("/api/policy", policyRoutes); // Policy routes don't need rate limiting
app.use("/api/monitoring", monitoringRateLimit, monitoringRoutes); // Monitoring dashboard with high limits for frequent refreshes
app.use("/api/docs", docsRoutes); // API documentation - no rate limiting needed

// 404 handler for unmatched routes - Fixed for path-to-regexp compatibility
app.use((req, res) => {
  logger.warn(
    {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    },
    "Route not found",
  );

  return res.status(404).json({
    error: "Not Found",
    message: "The requested resource was not found",
    path: req.originalUrl,
  });
});

// Central error handling middleware
app.use(errorHandler);

// --- 4. Server Startup and Graceful Shutdown ---
const startServer = async () => {
  try {
    // First, ensure the database is connected
    // Import enhanced database connection
    const { connectDatabase, queryPerformanceMiddleware } = await import(
      "./config/database.js"
    );

    queryPerformanceMiddleware();
    await connectDatabase();

    // Then, start the Express server
    const server = app.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          environment: env.NODE_ENV,
          nodeVersion: process.version,
          pid: process.pid,
          timestamp: new Date().toISOString(),
        },
        "🚀 Server started successfully",
      );

      if (env.NODE_ENV === "development") {
        logger.info(`📱 Frontend URL: ${env.FRONTEND_URL}`);
        logger.info(
          `🔗 API Health Check: http://localhost:${env.PORT}/api/health-check`,
        );
      }
    });

    // Enhanced graceful shutdown with proper resource cleanup
    const gracefulShutdown = async (signal: string) => {
      logger.info(`🛑 ${signal} received. Starting graceful shutdown...`);

      // Set timeout to force exit if graceful shutdown takes too long
      const shutdownTimeout = setTimeout(() => {
        logger.error("⏰ Graceful shutdown timeout. Forcing exit.");
        process.exit(1);
      }, 15000); // 15 seconds timeout (increased for better cleanup)

      try {
        // Stop accepting new connections
        server.close(async (err) => {
          if (err) {
            logger.error({ err }, "Error closing HTTP server");
          } else {
            logger.info("✅ HTTP server closed successfully");
          }

          try {
            // Close database connection
            await mongoose.connection.close();
            logger.info("✅ MongoDB connection closed successfully");

            // Clear the timeout and exit gracefully
            clearTimeout(shutdownTimeout);
            logger.info("👋 Graceful shutdown completed");
            process.exit(0);
          } catch (dbError) {
            logger.error({ err: dbError }, "Error closing MongoDB connection");
            clearTimeout(shutdownTimeout);
            process.exit(1);
          }
        });
      } catch (error) {
        logger.error({ err: error }, "Error during graceful shutdown");
        clearTimeout(shutdownTimeout);
        process.exit(1);
      }
    };

    // Listen for termination signals
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

    // Handle uncaught exceptions and unhandled rejections with proper logging
    process.on("uncaughtException", (err) => {
      logger.fatal({ err }, "💥 Uncaught Exception - shutting down");
      gracefulShutdown("UNCAUGHT_EXCEPTION");
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.fatal(
        {
          reason: String(reason),
          promise: promise.toString(),
        },
        "💥 Unhandled Promise Rejection - shutting down",
      );
      gracefulShutdown("UNHANDLED_REJECTION");
    });

    // Handle warnings
    process.on("warning", (warning) => {
      logger.warn(
        {
          name: warning.name,
          message: warning.message,
          stack: warning.stack,
        },
        "Process warning",
      );
    });

    // Start performance monitoring
    if (env.NODE_ENV === "production") {
      memoryMonitor();
      cpuMonitor();
    }

    return server;
  } catch (error) {
    logger.fatal({ err: error }, "Failed to start server");
    process.exit(1);
  }
};

// --- 5. Application Entry Point ---
startServer().catch((error) => {
  logger.fatal({ err: error }, "Fatal error during server startup");
  process.exit(1);
});
