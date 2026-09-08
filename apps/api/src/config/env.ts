import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  DATABASE_URL: z.string().min(1).optional(),

  WEB_ORIGIN: z
    .string()
    .min(1)
    .default("http://localhost:3000,http://localhost:5173"),

  // Auth
  AUTH_ACCESS_TOKEN_SECRET: z
    .string()
    .min(32, "AUTH_ACCESS_TOKEN_SECRET must be at least 32 characters")
    .default("default_dev_access_token_secret_32_characters_long"),
  AUTH_REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, "AUTH_REFRESH_TOKEN_SECRET must be at least 32 characters")
    .default("default_dev_refresh_token_secret_32_characters_long"),
  AUTH_ACCESS_TOKEN_TTL: z.string().default("15m"),
  AUTH_REFRESH_TOKEN_TTL: z.string().default("30d"),
  AUTH_MAX_ACTIVE_SESSIONS: z.coerce.number().int().min(1).max(20).default(5),

  // Upload quotas (P2): per-member daily budget + family ceiling.
  UPLOAD_DAILY_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(200 * 1024 * 1024),
  UPLOAD_DAILY_FILES: z.coerce.number().int().positive().default(100),
  FAMILY_QUOTA_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(8 * 1024 * 1024 * 1024),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Kulaya <noreply@kulaya.family>"),

  // Photo storage (Cloudflare R2) — optional: when absent, the API falls
  // back to local disk storage for development.
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),

  // Admin
  ADMIN_EMAIL: z.string().email().optional(),
});

export type Env = z.infer<typeof envSchema>;
export type ResolvedEnv = Env & { DATABASE_URL: string };

export function loadEnv(
  source: Record<string, string | undefined> = process.env,
): ResolvedEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`Environment validation failed:\n${details}`);
  }

  const raw = parsed.data;

  // Ensure API server listens on 3001 if PORT=3000, giving 3000 to Vite
  let port = raw.PORT;
  if (source.API_PORT) {
    port = Number.parseInt(source.API_PORT, 10);
  } else if (port === 3000) {
    port = 3001;
  }

  let databaseUrl = raw.DATABASE_URL;
  if (raw.NODE_ENV === "production") {
    // Fail closed: production must never boot on dev defaults, local disk
    // storage, localhost origins, or a missing database.
    const missing: string[] = [];
    if (!databaseUrl) missing.push("DATABASE_URL");
    for (const key of [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET",
    ] as const) {
      if (!raw[key]) missing.push(key);
    }
    if (raw.AUTH_ACCESS_TOKEN_SECRET.startsWith("default_dev_")) {
      missing.push("AUTH_ACCESS_TOKEN_SECRET (dev default forbidden)");
    }
    if (raw.AUTH_REFRESH_TOKEN_SECRET.startsWith("default_dev_")) {
      missing.push("AUTH_REFRESH_TOKEN_SECRET (dev default forbidden)");
    }
    if (
      /(^|,)https?:\/\/(localhost|127\.0\.0\.1)(,|:|\/|$)/.test(raw.WEB_ORIGIN)
    ) {
      missing.push("WEB_ORIGIN (localhost origin forbidden)");
    }
    if (missing.length > 0) {
      throw new Error(
        `Environment validation failed — missing production config:\n${missing.join("\n")}`,
      );
    }
  }
  if (databaseUrl === undefined) {
    databaseUrl = "mongodb://localhost:27017/family-portal";
  }

  const env = {
    ...raw,
    PORT: port,
    DATABASE_URL: databaseUrl,
    WEB_ORIGIN: raw.WEB_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
      .join(","),
  };

  return env;
}

/** Validated environment singleton — fails fast at startup. */
export const env: ResolvedEnv = loadEnv();
