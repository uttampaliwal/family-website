import pino from "pino";
import pinoHttp from "pino-http";

// Create logger configuration based on environment
const createLoggerConfig = () => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const logLevel = process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info");

  const baseConfig = {
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label: string) => ({ level: label }),
      log: (object: Record<string, unknown>) => {
        // Remove sensitive data from logs
        const sanitized = { ...object };
        if (sanitized.password) sanitized.password = "[REDACTED]";
        if (sanitized.token) sanitized.token = "[REDACTED]";
        if (sanitized.authorization) sanitized.authorization = "[REDACTED]";
        if (sanitized.cookie) sanitized.cookie = "[REDACTED]";
        return sanitized;
      },
    },
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        'res.headers["set-cookie"]',
        "password",
        "token",
        "secret",
      ],
      censor: "[REDACTED]",
    },
  };

  if (isDevelopment) {
    return {
      ...baseConfig,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      },
    };
  }

  return baseConfig;
};

// Create the main logger
export const logger = pino(createLoggerConfig());

// Create HTTP logger middleware
export const httpLogger = pinoHttp({
  logger,
  customLogLevel: (req, res, err?) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return "warn";
    } else if (res.statusCode >= 500 || err) {
      return "error";
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return "silent";
    }
    return "info";
  },
  customSuccessMessage: (req) => {
    if (req.url === "/api/health-check") {
      return "Health check";
    }
    return `${req.method} ${req.url}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} - ${err.message}`;
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});

// Utility functions for structured logging
export const createLogContext = (
  context: string,
  metadata?: Record<string, unknown>,
) => {
  return logger.child({ context, ...metadata });
};

export const logError = (
  error: Error,
  context?: string,
  metadata?: Record<string, unknown>,
) => {
  logger.error(
    {
      err: error,
      context,
      ...metadata,
    },
    error.message,
  );
};

export const logInfo = (
  message: string,
  metadata?: Record<string, unknown>,
) => {
  logger.info(metadata, message);
};

export const logWarn = (
  message: string,
  metadata?: Record<string, unknown>,
) => {
  logger.warn(metadata, message);
};

export const logDebug = (
  message: string,
  metadata?: Record<string, unknown>,
) => {
  logger.debug(metadata, message);
};

export default logger;
