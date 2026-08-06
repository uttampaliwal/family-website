import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  DATABASE_URL: z
    .string()
    .min(1)
    .default("mongodb://localhost:27017/family-portal"),

  WEB_ORIGIN: z.string().min(1).default("http://localhost:5173"),

  // Auth
  AUTH_ACCESS_TOKEN_SECRET: z
    .string()
    .min(32, "AUTH_ACCESS_TOKEN_SECRET must be at least 32 characters"),
  AUTH_REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, "AUTH_REFRESH_TOKEN_SECRET must be at least 32 characters"),
  AUTH_ACCESS_TOKEN_TTL: z.string().default("15m"),
  AUTH_REFRESH_TOKEN_TTL: z.string().default("30d"),
  AUTH_MAX_ACTIVE_SESSIONS: z.coerce.number().int().min(1).max(20).default(5),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Kulaya <noreply@kulaya.family>"),

  // Admin
  ADMIN_EMAIL: z.string().email().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(
  source: Record<string, string | undefined> = process.env,
): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`Environment validation failed:\n${details}`);
  }

  const env = parsed.data;
  env.WEB_ORIGIN = env.WEB_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .join(",");

  return env;
}

/** Validated environment singleton — fails fast at startup. */
export const env = loadEnv();
