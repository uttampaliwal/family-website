import type { Context, MiddlewareHandler, Next } from "hono";
import { timingSafeEqual } from "node:crypto";
import { can, type Capability, type Role } from "@family/core";
import { env } from "../config/env.js";
import { AppError } from "./error.js";
import {
  CSRF_COOKIE,
  readCookie,
  sha256,
  verifyAccessToken,
  verifyCsrfToken,
} from "../lib/auth.js";

const allowedOrigins = env.WEB_ORIGIN.split(",");

// ─── Authentication ─────────────────────────────────────────────────

declare module "hono" {
  interface ContextVariableMap {
    userId: string;
    userRole: Role;
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

/** Requires the authenticated user to hold the given capability. */
export function requireCapability(capability: Capability): MiddlewareHandler {
  return async (c, next) => {
    const userId = await authenticate(c);
    const { User } = await import("../models/user.js");
    const user = await User.findById(userId, { role: 1 }).lean();
    if (!user || !can(user.role, capability)) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission for this");
    }
    c.set("userId", userId);
    c.set("userRole", user.role);
    await next();
  };
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
 * Signed double-submit cookie CSRF. The client must echo the signed
 * `kulaya_csrf` cookie value in the `X-CSRF-Token` header. The server
 * verifies the cookie was signed by us (defeats cookie fixation) and that
 * header and cookie match (defeats cross-site forgery — an attacker's site
 * cannot read the cookie to echo it). The cookie is SameSite=Lax and
 * JS-readable by design. Login/register (no cookie yet) are protected by
 * originCheck alone.
 */
export function csrfProtection(c: Context, next: Next) {
  const method = c.req.method;
  if (!MUTATING_METHODS.has(method)) return next();

  const cookieValue = readCookie(c, CSRF_COOKIE);
  const headerValue = c.req.header("x-csrf-token");

  if (
    !cookieValue ||
    !headerValue ||
    !verifyCsrfToken(cookieValue) ||
    !constantTimeEquals(headerValue, cookieValue)
  ) {
    throw new AppError(403, "CSRF_TOKEN_MISMATCH", "Invalid security token");
  }
  return next();
}

/** Constant-time string comparison via SHA-256 digests. */
function constantTimeEquals(a: string, b: string): boolean {
  const da = Buffer.from(sha256(a), "hex");
  const db = Buffer.from(sha256(b), "hex");
  return timingSafeEqual(da, db);
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