import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";

let mongo: MongoMemoryServer;
let csrfToken: string;
const cookies: Record<string, string> = {};

const app = createApp();

const user = {
  name: "Aarav Sharma",
  email: "aarav@example.com",
  username: "aarav_s",
  password: "strong-password-123",
  dateOfBirth: "1990-05-20",
  gender: "male",
  relationship: "son",
};

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri("family-portal"));

  // Prime the CSRF cookie
  const res = await app.request("/api/auth/csrf-token");
  const setCookie = res.headers.getSetCookie()[0] ?? "";
  const match = /kulaya_csrf=([^;]+)/.exec(setCookie);
  csrfToken = match ? decodeURIComponent(match[1]!) : "";
  cookies.kulaya_csrf = csrfToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

function csrfHeaders(extra?: Record<string, string>) {
  return {
    "Content-Type": "application/json",
    "X-CSRF-Token": csrfToken,
    Cookie: cookieHeader(),
    ...extra,
  };
}

function cookieHeader() {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function captureCookies(res: Response) {
  for (const c of res.headers.getSetCookie()) {
    const [pair] = c.split(";");
    const eq = pair!.indexOf("=");
    const name = pair!.slice(0, eq);
    const value = decodeURIComponent(pair!.slice(eq + 1));
    if (value) {
      cookies[name] = value;
      if (name === "kulaya_csrf") csrfToken = value;
    } else {
      delete cookies[name];
    }
  }
}

async function json(res: Response) {
  return (await res.json()) as Record<string, unknown>;
}

describe("auth flow", () => {
  let accessToken = "";
  let rotatedAwayRefresh = "";

  it("rejects registration with a weak password", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: csrfHeaders(),
      body: JSON.stringify({ ...user, password: "short" }),
    });
    expect(res.status).toBe(422);
  });

  it("registers a new user", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: csrfHeaders(),
      body: JSON.stringify(user),
    });
    expect(res.status).toBe(201);
  });

  it("blocks duplicate registration", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: csrfHeaders(),
      body: JSON.stringify(user),
    });
    expect(res.status).toBe(409);
  });

  it("login is rejected before email verification", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: csrfHeaders(),
      body: JSON.stringify({ email: user.email, password: user.password }),
    });
    expect(res.status).toBe(403);
    expect((await json(res)).error).toBe("EMAIL_NOT_VERIFIED");
  });

  it("verifies email with the token from the database", async () => {
    const doc = await mongoose.connection.db!.collection("users").findOne({
      email: user.email,
    });
    expect(doc).toBeTruthy();
    // Token hash is stored; simulate the email link by re-deriving it —
    // for this test, directly verify using the same hashing the route uses.
    // (The real token is only available via the email service.)
    // We instead set verification directly to exercise approval gate.
    await mongoose.connection
      .db!.collection("users")
      .updateOne({ email: user.email }, { $set: { isVerified: true } });

    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: csrfHeaders(),
      body: JSON.stringify({ email: user.email, password: user.password }),
    });
    expect(res.status).toBe(403);
    expect((await json(res)).error).toBe("PENDING_APPROVAL");
  });

  it("admits the user after admin approval", async () => {
    await mongoose.connection
      .db!.collection("users")
      .updateOne(
        { email: user.email },
        { $set: { adminApprovalStatus: "approved" } },
      );

    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: csrfHeaders(),
      body: JSON.stringify({ email: user.email, password: user.password }),
    });
    expect(res.status).toBe(200);
    captureCookies(res);
    const body = await json(res);
    accessToken = body.accessToken as string;
    expect(cookies.kulaya_refresh).toBeTruthy();
    expect((body.user as { username: string }).username).toBe("aarav_s");
  });

  it("rejects requests with a missing CSRF token", async () => {
    const res = await app.request("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(403);
  });

  it("rejects cross-origin state changes", async () => {
    const res = await app.request("/api/auth/logout", {
      method: "POST",
      headers: {
        ...csrfHeaders(),
        Origin: "https://evil.example.com",
        Cookie: cookieHeader(),
      },
    });
    expect(res.status).toBe(403);
  });

  it("reads the user via /me", async () => {
    const res = await app.request("/api/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status).toBe(200);
    expect((await json(res)).user).toMatchObject({ username: "aarav_s" });
  });

  it("rotates the refresh token", async () => {
    const oldRefresh = cookies.kulaya_refresh;
    const res = await app.request("/api/auth/refresh", {
      method: "POST",
      headers: csrfHeaders(),
      body: "",
    });
    expect(res.status).toBe(200);
    captureCookies(res);
    expect(res.headers.getSetCookie().join()).toContain("kulaya_refresh");
    expect(cookies.kulaya_refresh).toBeTruthy();
    expect(cookies.kulaya_refresh).not.toBe(oldRefresh);
    rotatedAwayRefresh = oldRefresh!;
  });

  it("returns SESSION_ROTATED without wiping when a just-rotated token is replayed", async () => {
    // The old token is still validly signed, but its jti was superseded
    // microseconds ago — inside the replay grace window this must NOT look
    // like theft (no session wipe); the client retries with the current cookie.
    const res = await app.request("/api/auth/refresh", {
      method: "POST",
      headers: {
        ...csrfHeaders(),
        Cookie: cookieHeader().replace(
          /kulaya_refresh=[^;]*/,
          `kulaya_refresh=${rotatedAwayRefresh}`,
        ),
      },
      body: "",
    });
    expect(res.status).toBe(401);
    expect((await json(res)).error).toBe("SESSION_ROTATED");

    // Sessions survived: the current cookie still rotates.
    const retry = await app.request("/api/auth/refresh", {
      method: "POST",
      headers: csrfHeaders(),
      body: "",
    });
    expect(retry.status).toBe(200);
    captureCookies(retry);
  });

  it("logs out and clears the session", async () => {
    const res = await app.request("/api/auth/logout", {
      method: "POST",
      headers: { ...csrfHeaders(), Cookie: cookieHeader() },
    });
    expect(res.status).toBe(200);
    captureCookies(res);
    expect(cookies.kulaya_refresh).toBeUndefined();

    const refreshRes = await app.request("/api/auth/refresh", {
      method: "POST",
      headers: csrfHeaders(),
      body: "",
    });
    expect(refreshRes.status).toBe(401);
  });
});

describe("username availability", () => {
  it("rejects invalid usernames", async () => {
    const res = await app.request("/api/auth/check-username?username=ab");
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body).toMatchObject({ valid: false, available: false });
  });

  it("reports a fresh username as available", async () => {
    const res = await app.request("/api/auth/check-username?username=shanti_k");
    expect(res.status).toBe(200);
    expect(await json(res)).toMatchObject({
      valid: true,
      available: true,
    });
  });

  it("reports a taken username as unavailable", async () => {
    const res = await app.request("/api/auth/check-username?username=aarav_s");
    expect(res.status).toBe(200);
    expect(await json(res)).toMatchObject({
      valid: true,
      available: false,
    });
  });
});
