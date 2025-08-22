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
import healthRoutes from "./routes/health.js";
import documentRoutes from "./routes/documents.js";

// Import middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { csrfProtection } from "./middleware/csrfGenerator.js";
import {
  generalRateLimit,
  speedLimiter,
  securityHeaders,
  requestId,
  requestSizeLimiter,
} from "./middleware/security.js";
import {
  performanceMonitor,
  memoryMonitor,
  cpuMonitor,
} from "./middleware/performance.js";

// --- 1. Environment Setup ---
// Environment validation is now handled in ./config/environment.js

// --- 2. Database Connection ---
const connectDb = async () => {
  try {
    // Enhanced MongoDB connection with modern options
    await mongoose.connect(env.MONGO_URI, {
      family: 4, // Force IPv4
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
    });

    logger.info(
      {
        host: new URL(env.MONGO_URI).hostname,
        database: new URL(env.MONGO_URI).pathname.slice(1),
      },
      "MongoDB connection established successfully",
    );
  } catch (error) {
    logger.fatal({ err: error }, "Failed to connect to MongoDB");
    process.exit(1);
  }
};

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

// Performance monitoring
app.use(performanceMonitor);

// Compression middleware for better performance
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024, // Only compress responses larger than 1KB
  }),
);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for API
  }),
);

app.use(securityHeaders);
app.use(requestSizeLimiter("50mb")); // Limit request size

// CORS configuration
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-CSRF-Token",
    ],
    exposedHeaders: ["X-Request-ID"],
  }),
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Rate limiting and speed limiting
app.use(speedLimiter);
app.use(generalRateLimit);

// Health check route (before CSRF protection)
app.use("/api", healthRoutes);

// CSRF protection for state-changing operations
app.use(csrfProtection);

// API routes with enhanced logging
app.use("/api/auth", authRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/documents", documentRoutes);

// 404 handler for unmatched routes
app.use("*", (req, res) => {
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
    await connectDb();

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
