import mongoose from "mongoose";
import { logger } from "./logger.js";

/**
 * Safely create database indexes, handling duplicate index errors
 */
export async function createIndexesSafely() {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }

    logger.info("Creating database indexes for performance optimization...");

    // Get all collections
    const collections = await db.listCollections().toArray();

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);

      try {
        // Get existing indexes
        const existingIndexes = await collection.indexes();
        const indexNames = existingIndexes.map((idx) => idx.name);

        logger.debug(
          {
            collection: collectionName,
            existingIndexes: indexNames,
          },
          "Existing indexes found",
        );
      } catch (error) {
        logger.warn(
          {
            collection: collectionName,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "Could not check existing indexes",
        );
      }
    }

    // Let Mongoose handle index creation with proper error handling
    const models = mongoose.models;
    const indexPromises = Object.keys(models).map(async (modelName) => {
      try {
        const model = models[modelName];
        await model.syncIndexes();
        logger.debug(`Indexes synced for model: ${modelName}`);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("only one text index per collection allowed")
        ) {
          logger.debug(`Text index already exists for ${modelName}, skipping`);
        } else if (
          error instanceof Error &&
          error.message.includes("duplicate key")
        ) {
          logger.debug(`Index already exists for ${modelName}, skipping`);
        } else {
          logger.warn(
            {
              model: modelName,
              error: error instanceof Error ? error.message : "Unknown error",
            },
            "Failed to sync indexes for model",
          );
        }
      }
    });

    await Promise.allSettled(indexPromises);
    logger.info("Database index creation completed");
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      "Failed to create database indexes",
    );
    // Don't throw - this shouldn't prevent server startup
  }
}

/**
 * Drop and recreate all indexes (use with caution)
 */
export async function recreateAllIndexes() {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }

    logger.warn("Recreating all database indexes...");

    const models = mongoose.models;
    for (const modelName of Object.keys(models)) {
      try {
        const model = models[modelName];
        await model.collection.dropIndexes();
        await model.syncIndexes();
        logger.info(`Recreated indexes for model: ${modelName}`);
      } catch (error) {
        logger.warn(
          {
            model: modelName,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "Failed to recreate indexes for model",
        );
      }
    }

    logger.info("Index recreation completed");
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      "Failed to recreate indexes",
    );
    throw error;
  }
}
