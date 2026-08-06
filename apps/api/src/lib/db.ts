import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

let connectionState: "disconnected" | "connected" | "error" = "disconnected";

export function getDbStatus() {
  return {
    connected: mongoose.connection.readyState === 1,
    state: connectionState,
  };
}

export async function connectDb(): Promise<void> {
  mongoose.connection.on("connected", () => {
    connectionState = "connected";
    logger.info("MongoDB connected");
  });
  mongoose.connection.on("error", (err) => {
    connectionState = "error";
    logger.error({ err }, "MongoDB connection error");
  });
  mongoose.connection.on("disconnected", () => {
    connectionState = "disconnected";
    logger.warn("MongoDB disconnected");
  });

  try {
    await mongoose.connect(env.DATABASE_URL, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      throw err;
    }
    // Local development — start the API anyway; health-check reports db state.
    logger.error(
      { err },
      "MongoDB unavailable — continuing in development mode",
    );
  }
}

export async function disconnectDb(): Promise<void> {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed");
}

export async function isDbHealthy(): Promise<boolean> {
  try {
    await mongoose.connection.db?.admin().ping();
    return true;
  } catch {
    return false;
  }
}
