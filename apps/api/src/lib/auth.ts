import type { Context } from "hono";
import { SignJWT, jwtVerify } from "jose";
import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { env } from "../config/env.js";

export const ACCESS_COOKIE = "kulaya_access";
export const REFRESH_COOKIE = "kulaya_refresh";
export const CSRF_COOKIE = "kulaya_csrf";

const accessSecret = new TextEncoder().encode(env.AUTH_ACCESS_TOKEN_SECRET);
const refreshSecret = new TextEncoder().encode(env.AUTH_REFRESH_TOKEN_SECRET);

export type TokenPayload = {
  sub: string;
  jti: string;
  type: "access" | "refresh";
  /** Security version — only present on access tokens. */
  av?: number;
};

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function generateRandomToken(): string {
  return randomBytes(32).toString("hex");
}

// ─── Signed double-submit CSRF tokens ─────────────────────────────
//
// OWASP's recommended double-submit variant: the cookie holds a random
// nonce plus an HMAC signature keyed by the access-token secret (same
// key Rails uses for its signed CSRF tokens). The browser echoes the
// cookie value in `X-CSRF-Token`; the server checks the signature — so an
// attacker who can *write* the cookie (cookie fixation, subdomain) still
// can't mint a valid pair — and then the header/cookie equality, which a
// cross-site reader cannot observe.

const csrfKey = new TextEncoder().encode(env.AUTH_ACCESS_TOKEN_SECRET);

export function createCsrfToken(): string {
  const nonce = randomBytes(24).toString("base64url");
  return `${nonce}.${signCsrf(nonce)}`;
}

/** True only for tokens this server signed and that haven't been tampered with. */
export function verifyCsrfToken(token: string): boolean {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;
  const nonce = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!nonce || !signature) return false;
  const expected = Buffer.from(signCsrf(nonce));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function signCsrf(nonce: string): string {
  return createHmac("sha256", csrfKey).update(nonce).digest("base64url");
}

export async function signAccessToken(
  userId: string,
  authVersion: number,
): Promise<string> {
  return new SignJWT({ type: "access", av: authVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(env.AUTH_ACCESS_TOKEN_TTL)
    .sign(accessSecret);
}

export async function signRefreshToken(
  userId: string,
  jti: string,
): Promise<string> {
  return new SignJWT({ type: "refresh", jti })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(env.AUTH_REFRESH_TOKEN_TTL)
    .sign(refreshSecret);
}

export async function verifyAccessToken(
  token: string,
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret, {
      algorithms: ["HS256"],
    });
    if (payload.type !== "access" || !payload.sub || !payload.jti) return null;
    const av = typeof payload.av === "number" ? payload.av : undefined;
    return { sub: payload.sub, jti: payload.jti, type: "access", av };
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret, {
      algorithms: ["HS256"],
    });
    if (payload.type !== "refresh" || !payload.sub || !payload.jti) return null;
    return { sub: payload.sub, jti: payload.jti, type: "refresh" };
  } catch {
    return null;
  }
}

// ─── Cookie helpers ─────────────────────────────────────────────────

const isProd = process.env.NODE_ENV === "production";

/**
 * Set the refresh token as an HttpOnly cookie scoped to /api/auth.
 * SameSite=Lax blocks cross-site POSTs while still allowing the
 * top-level navigation used by email links.
 */
export function setRefreshCookie(c: Context, token: string) {
  c.header(
    "Set-Cookie",
    cookieHeader(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "Lax",
      path: "/api/auth",
      maxAge: secondsOf(env.AUTH_REFRESH_TOKEN_TTL),
    }),
    { append: true },
  );
}

/** Double-submit CSRF token — JS-readable, sent with every API request. */
export function setCsrfCookie(c: Context, token: string) {
  c.header(
    "Set-Cookie",
    cookieHeader(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: isProd,
      sameSite: "Lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    }),
    { append: true },
  );
}

export function clearAuthCookies(c: Context) {
  // The CSRF cookie is session-independent (double-submit token) and is
  // deliberately kept so the client can continue making API calls.
  c.header(
    "Set-Cookie",
    cookieHeader(REFRESH_COOKIE, "", {
      httpOnly: true,
      secure: isProd,
      sameSite: "Lax",
      path: "/api/auth",
      maxAge: 0,
    }),
    { append: false },
  );
}

function secondsOf(ttl: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(ttl);
  if (!match) return 30 * 24 * 60 * 60;
  const n = Number(match[1]);
  switch (match[2]) {
    case "s":
      return n;
    case "m":
      return n * 60;
    case "h":
      return n * 3600;
    case "d":
      return n * 86400;
    default:
      return n;
  }
}

function cookieHeader(
  name: string,
  value: string,
  opts: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "Lax" | "Strict" | "None";
    path: string;
    maxAge: number;
  },
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${opts.path}`,
    `Max-Age=${opts.maxAge}`,
    `SameSite=${opts.sameSite}`,
  ];
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  return parts.join("; ");
}

export function readCookie(c: Context, name: string): string | undefined {
  const raw = c.req.header("cookie");
  if (!raw) return undefined;
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}
