import mongoose from "mongoose";
import { logger } from "../utils/logger.js";
import { env } from "./environment.js";

// Database indexes for performance optimization
export const createDatabaseIndexes = async (): Promise<void> => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      logger.warn("Database connection not available for indexing");
      return;
    }

    logger.info("Creating database indexes for performance optimization...");

    // User collection indexes
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ username: 1 }, { unique: true });
    await db.collection("users").createIndex({ isEmailVerified: 1 });
    await db.collection("users").createIndex({ role: 1 });
    await db.collection("users").createIndex({ createdAt: -1 });

    // Document collection indexes
    await db.collection("documents").createIndex({ author: 1 });
    await db.collection("documents").createIndex({ isPublic: 1 });
    // Text search index - commented out to prevent duplicate index error
    // await db.collection("documents").createIndex({ title: "text", content: "text" });
    await db.collection("documents").createIndex({ createdAt: -1 });
    await db.collection("documents").createIndex({ author: 1, isPublic: 1 }); // Compound index

    // Calendar events indexes (if exists)
    await db.collection("events").createIndex({ userId: 1 });
    await db.collection("events").createIndex({ date: 1 });
    await db.collection("events").createIndex({ userId: 1, date: 1 }); // Compound index

    // Family relationships indexes (if exists)
    await db.collection("relationships").createIndex({ userId: 1 });
    await db.collection("relationships").createIndex({ relatedUserId: 1 });

    // Tasks indexes (if exists)
    await db.collection("tasks").createIndex({ userId: 1 });
    await db.collection("tasks").createIndex({ status: 1 });
    await db.collection("tasks").createIndex({ dueDate: 1 });

    // Photos indexes (if exists)
    await db.collection("photos").createIndex({ userId: 1 });
    await db.collection("photos").createIndex({ uploadedAt: -1 });

    logger.info("Database indexes created successfully");
  } catch (error) {
    logger.error(`Failed to create database indexes: ${String(error)}`);
    // Don't throw - index creation failure shouldn't stop the app
  }
};

// Enhanced connection configuration for performance
export const connectDatabase = async (): Promise<void> => {
  try {
    const connectionOptions: mongoose.ConnectOptions = {
      // Connection pool settings for performance
      maxPoolSize: 10, // Maximum number of connections
      minPoolSize: 2, // Minimum number of connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // How long to try selecting a server
      socketTimeoutMS: 45000, // How long to wait for a response
      // bufferMaxEntries: 0, // Disabled - not available in current mongoose version
      bufferCommands: false, // Disable mongoose buffering

      // Performance optimizations
      compressors: "zlib", // Enable compression
      readPreference: "primary", // Read from primary for consistency
      writeConcern: {
        w: "majority",
        j: true, // Journal write concern
        wtimeout: 10000,
      },
    };

    // Connect to MongoDB
    await mongoose.connect(env.MONGO_URI, connectionOptions);

    // Set up connection event handlers
    mongoose.connection.on("connected", () => {
      logger.info("MongoDB connected successfully");
    });

    mongoose.connection.on("error", (error) => {
      logger.error(`MongoDB connection error: ${String(error)}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    // Graceful shutdown handling
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        logger.info("MongoDB connection closed through app termination");
        process.exit(0);
      } catch (error) {
        logger.error(`Error closing MongoDB connection: ${String(error)}`);
        process.exit(1);
      }
    });

    // Create performance indexes after connection
    await createDatabaseIndexes();
  } catch (error) {
    logger.fatal(`Failed to connect to MongoDB: ${String(error)}`);
    process.exit(1);
  }
};

// Query performance monitoring middleware
export const queryPerformanceMiddleware = () => {
  if (env.NODE_ENV === "development") {
    mongoose.set(
      "debug",
      (
        collection: string,
        method: string,
        query: Record<string, unknown>,
        doc: Record<string, unknown>,
      ) => {
        const start = Date.now();
        logger.debug(
          {
            query: JSON.stringify(query),
            doc: doc ? JSON.stringify(doc) : undefined,
            executionTime: Date.now() - start,
          },
          `MongoDB Query: ${collection}.${method}`,
        );
      },
    );
  }
};
