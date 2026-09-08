import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

interface MemoryServerInstance {
  getUri(dbName?: string): string;
  stop(): Promise<boolean>;
}

let connectionState: "disconnected" | "connected" | "error" = "disconnected";
let memoryServer: MemoryServerInstance | null = null;

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
      serverSelectionTimeoutMS: 2000,
      socketTimeoutMS: 45000,
    });
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      throw err;
    }
    logger.warn(
      { err },
      "Standalone MongoDB unavailable — spinning up in-memory MongoDB for development",
    );
    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      memoryServer = await MongoMemoryServer.create();
      const uri = memoryServer.getUri("family-portal");
      await mongoose.connect(uri);
      connectionState = "connected";
      logger.info("Connected to in-memory MongoDB server");
    } catch (memErr) {
      logger.error({ err: memErr }, "Failed to start MongoMemoryServer");
    }
  }
}

export async function disconnectDb(): Promise<void> {
  await mongoose.connection.close();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
  logger.info("MongoDB connection closed");
}

export async function isDbHealthy(): Promise<boolean> {
  // readyState 1 = connected. Without this guard, `connection.db` is
  // undefined when disconnected and the optional chain resolves without
  // throwing — falsely reporting healthy.
  if (mongoose.connection.readyState !== 1) return false;
  try {
    await mongoose.connection.db?.admin().ping();
    return true;
  } catch {
    return false;
  }
}
