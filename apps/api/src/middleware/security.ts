import type { Context, MiddlewareHandler, Next } from "hono";
import { env } from "../config/env.js";
import { AppError } from "./error.js";
import { CSRF_COOKIE, readCookie, verifyAccessToken } from "../lib/auth.js";

const allowedOrigins = env.WEB_ORIGIN.split(",");

// ─── Authentication ─────────────────────────────────────────────────

declare module "hono" {
  interface ContextVariableMap {
    userId: string;
  }
}

/** Verifies the bearer token and returns the authenticated user's id. */
async function authenticate(c: Context): Promise<string> {
  const header = c.req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) throw new AppError(401, "UNAUTHORIZED", "Sign in to continue");

  const payload = await verifyAccessToken(token);
  if (!payload) throw new AppError(401, "UNAUTHORIZED", "Session expired");

  return payload.sub;
}

/** Requires a valid bearer access token. */
export async function requireAuth(c: Context, next: Next) {
  c.set("userId", await authenticate(c));
  await next();
}

/** Requires the authenticated user to be an admin. */
export async function requireAdmin(c: Context, next: Next) {
  const userId = await authenticate(c);
  const { User } = await import("../models/user.js");
  const user = await User.findById(userId, { role: 1 }).lean();
  if (!user || user.role !== "admin") {
    throw new AppError(403, "FORBIDDEN", "Admin access required");
  }
  c.set("userId", userId);
  await next();
}

// ─── CSRF & origin checks ───────────────────────────────────────────

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Rejects cross-origin requests outright. Browsers send an Origin header
 * on all cross-origin and state-changing requests, so an absent header
 * (curl, same-origin GET) is allowed.
 */
export function originCheck(c: Context, next: Next) {
  const method = c.req.method;
  if (MUTATING_METHODS.has(method)) {
    const origin = c.req.header("origin");
    if (origin && !allowedOrigins.includes(origin)) {
      throw new AppError(403, "FORBIDDEN", "Origin not allowed");
    }
  }
  return next();
}

/**
 * Double-submit cookie CSRF: the client must echo the `kulaya_csrf` cookie
 * value in the `X-CSRF-Token` header. The cookie is SameSite=Lax and
 * JS-readable; an attacker's site cannot read it, so it cannot be echoed.
 * Login/register (no cookie yet) are protected by originCheck alone.
 */
export function csrfProtection(c: Context, next: Next) {
  const method = c.req.method;
  if (!MUTATING_METHODS.has(method)) return next();

  const cookieValue = readCookie(c, CSRF_COOKIE);
  const headerValue = c.req.header("x-csrf-token");

  if (!cookieValue || !headerValue || cookieValue !== headerValue) {
    throw new AppError(403, "CSRF_TOKEN_MISMATCH", "Invalid security token");
  }
  return next();
}

// ─── Rate limiting (in-memory; swap for Upstash on serverless) ──────

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(opts: {
  windowMs: number;
  max: number;
  name: string;
}): MiddlewareHandler {
  return (c, next) => {
    const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const key = `${opts.name}:${ip}:${c.req.path}`;
    const now = Date.now();

    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > opts.max) {
      throw new AppError(
        429,
        "RATE_LIMITED",
        "Too many requests — please try again later",
      );
    }
    return next();
  };
}

/** Prune expired buckets periodically. */
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref();