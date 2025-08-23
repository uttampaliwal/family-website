import { z } from "zod";
import { logger } from "../utils/logger.js";

// Helper function to detect if running in Docker
const isRunningInDocker = (): boolean => {
  // Check for Docker-specific environment indicators
  return !!(
    process.env.DOCKER_CONTAINER ||
    process.env.KUBERNETES_SERVICE_HOST ||
    process.env.HOSTNAME?.includes("docker") ||
    process.env.HOSTNAME?.includes("container")
  );
};

// Helper function to get the appropriate MongoDB host
const getMongoHost = (): string => {
  // If MONGO_HOST is explicitly set, use it
  if (process.env.MONGO_HOST) {
    return process.env.MONGO_HOST;
  }

  // Auto-detect based on environment
  return isRunningInDocker() ? "mongo" : "localhost";
};

// Helper function to build MongoDB URI
const buildMongoUri = (): string => {
  const host = getMongoHost();
  const database = "family-website";

  // For Docker environment, use authentication
  if (host === "mongo") {
    const username = process.env.MONGO_INITDB_ROOT_USERNAME || "root";
    const password = process.env.MONGO_INITDB_ROOT_PASSWORD || "password";
    return `mongodb://${username}:${password}@${host}:27017/${database}?authSource=admin`;
  }

  // For local development, try without authentication first
  return `mongodb://${host}:27017/${database}`;
};

// Define the environment schema using Zod
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().transform((val) => {
    const port = parseInt(val, 10);
    if (isNaN(port) || port <= 0 || port > 65535) {
      throw new Error(
        `Invalid PORT: ${val}. Must be a number between 1 and 65535.`,
      );
    }
    return port;
  }),

  // Database Configuration
  MONGO_URI: z
    .string()
    .optional()
    .transform(() => {
      // Always build URI dynamically to respect MONGO_HOST
      return buildMongoUri();
    })
    .refine((uri) => {
      try {
        new URL(uri);
        return uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://");
      } catch {
        return false;
      }
    }, "MONGO_URI must be a valid MongoDB connection string"),

  // JWT Configuration
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long"),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, "REFRESH_TOKEN_SECRET must be at least 32 characters long"),

  // Frontend Configuration
  FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL"),

  // Email Configuration
  EMAIL_USER: z.string().email("EMAIL_USER must be a valid email address"),
  EMAIL_PASS: z.string().min(1, "EMAIL_PASS is required"),

  // Optional Configuration
  API_BASE_URL: z.string().url().optional(),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  LOG_FORMAT: z.enum(["json", "pretty"]).default("json"),

  // Rate Limiting Configuration
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("900000"), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("100"),

  // Security Configuration
  CSRF_SECRET: z
    .string()
    .min(16, "CSRF_SECRET must be at least 16 characters long")
    .optional(),

  // Turbo Configuration
  TURBO_TELEMETRY_DISABLED: z.string().optional(),
});

export type Environment = z.infer<typeof envSchema>;

// Validate and parse environment variables
export const validateEnvironment = (): Environment => {
  try {
    const env = envSchema.parse(process.env);

    const mongoHost = getMongoHost();
    const isDocker = isRunningInDocker();

    logger.info(
      {
        nodeEnv: env.NODE_ENV,
        port: env.PORT,
        logLevel: env.LOG_LEVEL,
        mongoHost,
        isDocker,
        mongoUri: env.MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"), // Hide credentials in logs
        hasJwtSecret: !!env.JWT_SECRET,
        hasRefreshTokenSecret: !!env.REFRESH_TOKEN_SECRET,
        hasFrontendUrl: !!env.FRONTEND_URL,
        hasEmailConfig: !!(env.EMAIL_USER && env.EMAIL_PASS),
      },
      "Environment validation successful",
    );

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");

      logger.fatal(
        {
          validationErrors: error.errors,
          errorMessages,
        },
        "Environment validation failed",
      );

      console.error("\n❌ Environment Validation Failed:");
      console.error(errorMessages);
      console.error(
        "\n💡 Please check your .env file and ensure all required variables are set.",
      );
      console.error("📖 See .env.example for reference.\n");

      process.exit(1);
    }

    logger.fatal(
      { err: error },
      "Unexpected error during environment validation",
    );
    process.exit(1);
  }
};

// Export validated environment
export const env = validateEnvironment();

// Helper function to check if we're in production
export const isProduction = () => env.NODE_ENV === "production";

// Helper function to check if we're in development
export const isDevelopment = () => env.NODE_ENV === "development";

// Helper function to check if we're in test mode
export const isTest = () => env.NODE_ENV === "test";
