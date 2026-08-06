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
