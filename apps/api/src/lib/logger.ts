import { pino } from "pino";
import { env } from "../config/env.js";

const level = process.env.NODE_ENV === "test" ? "silent" : env.LOG_LEVEL;

export const logger = pino({
  level,
  base: { service: "family-portal-api" },
  timestamp: pino.stdTimeFunctions.isoTime,
  // No-secrets guardrail (P0 audit): never log credentials, tokens, signed
  // URLs or share tokens, even at debug level. New code paths (refresh
  // diagnostics, email retries, reconciliation) must pass structured fields
  // through here rather than stringifying request objects.
  redact: {
    paths: [
      "authorization",
      "*.authorization",
      "accessToken",
      "*.accessToken",
      "refreshToken",
      "*.refreshToken",
      "token",
      "*.token",
      "csrfToken",
      "*.csrfToken",
      "signedUrl",
      "*.signedUrl",
      "shareToken",
      "*.shareToken",
      "password",
      "*.password",
    ],
    censor: "[REDACTED]",
  },
});
