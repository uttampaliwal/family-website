import { pino } from "pino";
import { env } from "../config/env.js";

const level = process.env.NODE_ENV === "test" ? "silent" : env.LOG_LEVEL;

export const logger = pino({
  level,
  base: { service: "family-portal-api" },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const httpLoggerOptions = {
  logger,
  customLogLevel: (_req: unknown, res: { statusCode: number }) =>
    res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
  autoLogging: process.env.NODE_ENV !== "test",
};
