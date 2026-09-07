import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { hashPassword } from "../lib/passwords.js";
import { User } from "../models/user.js";

let mongo: MongoMemoryServer;
let csrfToken = "";

const app = createApp();

interface Session {
  accessToken: string;
  refreshCookie: string;
}

const PASSWORD = "strong-password-123";
let userSeq = 0;

async function primeCsrf() {
  const res = await app.request("/api/auth/csrf-token");
  const setCookie = res.headers.getSetCookie()[0] ?? "";
  const match = /kulaya_csrf=([^;]+)/.exec(setCookie);
  csrfToken = match ? decodeURIComponent(match[1]!) : "";
}

function baseHeaders(extra?: Record<string, string>) {
  return {
    "Content-Type": "application/json",
    "X-CSRF-Token": csrfToken,
    Cookie: `kulaya_csrf=${csrfToken}`,
    ...extra,
  };
}

function refreshCookieOf(res: Response): string {
  for (const c of res.headers.getSetCookie()) {
    const [pair] = c.split(";");
    const eq = pair!.indexOf("=");
    if (pair!.slice(0, eq) === "kulaya_refresh") {
      return decodeURIComponent(pair!.slice(eq + 1));
    }
  }
  throw new Error("no kulaya_refresh cookie set");
}

async function createUser(overrides: Record<string, unknown> = {}) {
  userSeq += 1;
  const passwordHash = await hashPassword(PASSWORD);
  return User.create({
    name: `Test User ${userSeq}`,
    email: `revoke${userSeq}_${Date.now()}@example.com`,
    username: `revoke${userSeq}_${Math.random().toString(36).slice(2, 9)}`,
    passwordHash,
    dateOfBirth: new Date("1990-05-20"),
    gender: "male",
    relationship: "son",
    isVerified: true,
    role: "adult",
    adminApprovalStatus: "approved",
    ...overrides,
  });
}

async function signIn(email: string): Promise<Session> {
  // Unique source IP per sign-in: login is rate-limited per IP and the
  // limiter is not what this suite exercises.
  userSeq += 1;
  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: baseHeaders({ "X-Forwarded-For": `10.9.0.${userSeq % 250}` }),
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  expect(res.status).toBe(200);
  const body = (await res.json()) as { accessToken: string };
  return { accessToken: body.accessToken, refreshCookie: refreshCookieOf(res) };
}

function authHeaders(session: Session) {
  return baseHeaders({ Authorization: `Bearer ${session.accessToken}` });
}

async function doRefresh(refreshCookie: string) {
  const res = await app.request("/api/auth/refresh", {
    method: "POST",
    headers: baseHeaders({
      Cookie: `kulaya_csrf=${csrfToken}; kulaya_refresh=${refreshCookie}`,
    }),
  });
  return res;
}

async function decide(
  admin: Session,
  userId: string,
  body: Record<string, unknown>,
) {
  return app.request(`/api/admin/members/${userId}`, {
    method: "PATCH",
    headers: authHeaders(admin),
    body: JSON.stringify(body),
  });
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri("family-portal"));
  await primeCsrf();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("revocation and session invalidation", () => {
  it("rejected members lose every protected endpoint immediately", async () => {
    const owner = await createUser({ role: "owner" });
    const admin = await createUser({ role: "admin" });
    const member = await createUser({ role: "adult" });
    const ownerSession = await signIn(owner.email);
    const adminSession = await signIn(admin.email);
    const memberSession = await signIn(member.email);

    // Sanity: approved member can read.
    expect(
      (
        await app.request("/api/members", {
          headers: authHeaders(memberSession),
        })
      ).status,
    ).toBe(200);

    const res = await decide(adminSession, member._id.toString(), {
      status: "rejected",
    });
    expect(res.status).toBe(200);

    // Old access token is dead at once (authVersion bumped) — not after TTL.
    for (const path of [
      "/api/members",
      "/api/members/tree",
      "/api/posts",
      "/api/photos",
      "/api/auth/me",
    ]) {
      const r = await app.request(path, {
        headers: authHeaders(memberSession),
      });
      expect([401, 403]).toContain(r.status);
    }

    // Rejected admin capability is gone even though the role row is untouched.
    expect(
      (
        await app.request("/api/admin/members", {
          headers: authHeaders(memberSession),
        })
      ).status,
    ).toBe(403);

    // Owner still works.
    expect(
      (
        await app.request("/api/members", {
          headers: authHeaders(ownerSession),
        })
      ).status,
    ).toBe(200);
  });

  it("refresh after rejection is refused and mints nothing", async () => {
    const admin = await createUser({ role: "admin" });
    const member = await createUser({ role: "adult" });
    const adminSession = await signIn(admin.email);
    const memberSession = await signIn(member.email);

    expect(
      (
        await decide(adminSession, member._id.toString(), {
          status: "rejected",
        })
      ).status,
    ).toBe(200);

    const res = await doRefresh(memberSession.refreshCookie);
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: string }).error).toBe(
      "ACCESS_REVOKED",
    );
  });

  it("suspended members cannot log in, read, or refresh", async () => {
    const admin = await createUser({ role: "admin" });
    const member = await createUser({ role: "adult" });
    const adminSession = await signIn(admin.email);
    const memberSession = await signIn(member.email);

    expect(
      (
        await decide(adminSession, member._id.toString(), {
          status: "suspended",
        })
      ).status,
    ).toBe(200);

    expect(
      (
        await app.request("/api/members", {
          headers: authHeaders(memberSession),
        })
      ).status,
    ).toBe(403);

    const login = await app.request("/api/auth/login", {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ email: member.email, password: PASSWORD }),
    });
    expect(login.status).toBe(403);
    expect(((await login.json()) as { error: string }).error).toBe(
      "ACCESS_SUSPENDED",
    );

    expect((await doRefresh(memberSession.refreshCookie)).status).toBe(403);
  });

  it("a rejected admin loses admin APIs immediately", async () => {
    const owner = await createUser({ role: "owner" });
    const admin = await createUser({ role: "admin" });
    const ownerSession = await signIn(owner.email);
    const adminSession = await signIn(admin.email);

    expect(
      (
        await app.request("/api/admin/members", {
          headers: authHeaders(adminSession),
        })
      ).status,
    ).toBe(200);

    expect(
      (await decide(ownerSession, admin._id.toString(), { status: "rejected" }))
        .status,
    ).toBe(200);

    expect(
      (
        await app.request("/api/admin/members", {
          headers: authHeaders(adminSession),
        })
      ).status,
    ).toBe(403);
    expect((await doRefresh(adminSession.refreshCookie)).status).toBe(403);
  });

  it("role demotion invalidates outstanding access tokens", async () => {
    const owner = await createUser({ role: "owner" });
    const admin = await createUser({ role: "admin" });
    const ownerSession = await signIn(owner.email);
    const adminSession = await signIn(admin.email);

    expect(
      (
        await decide(ownerSession, admin._id.toString(), {
          status: "approved",
          role: "adult",
        })
      ).status,
    ).toBe(200);

    // Old admin-scoped token no longer passes (authVersion mismatch → 401).
    expect(
      (
        await app.request("/api/admin/members", {
          headers: authHeaders(adminSession),
        })
      ).status,
    ).toBe(401);

    // A fresh session as the demoted adult is capability-blocked.
    const demotedSession = await signIn(admin.email);
    expect(
      (
        await app.request("/api/admin/members", {
          headers: authHeaders(demotedSession),
        })
      ).status,
    ).toBe(403);
  });

  it("multi-tab refresh race returns SESSION_ROTATED without wiping", async () => {
    const member = await createUser({ role: "adult" });
    const session = await signIn(member.email);

    // Tab A wins.
    const first = await doRefresh(session.refreshCookie);
    expect(first.status).toBe(200);
    const currentCookie = refreshCookieOf(first);

    // Tab B replays the superseded token inside the grace window.
    const replay = await doRefresh(session.refreshCookie);
    expect(replay.status).toBe(401);
    expect(((await replay.json()) as { error: string }).error).toBe(
      "SESSION_ROTATED",
    );

    // Sessions were NOT wiped: the current cookie still rotates fine.
    const retry = await doRefresh(currentCookie);
    expect(retry.status).toBe(200);
  });

  it("refresh with an unknown token revokes every session", async () => {
    const member = await createUser({ role: "adult" });
    const session = await signIn(member.email);

    // Simulate logout elsewhere, then present the dead token = reuse shape.
    const logout = await app.request("/api/auth/logout", {
      method: "POST",
      headers: baseHeaders({
        Cookie: `kulaya_csrf=${csrfToken}; kulaya_refresh=${session.refreshCookie}`,
      }),
    });
    expect(logout.status).toBe(200);

    const res = await doRefresh(session.refreshCookie);
    expect(res.status).toBe(401);
    expect(((await res.json()) as { error: string }).error).toBe(
      "SESSION_REVOKED",
    );
  });

  it("one member cannot delete another member's post (BOLA)", async () => {
    const teenA = await createUser({ role: "teen" });
    const teenB = await createUser({ role: "teen" });
    const sessionA = await signIn(teenA.email);
    const sessionB = await signIn(teenB.email);

    const created = await app.request("/api/posts", {
      method: "POST",
      headers: authHeaders(sessionA),
      body: JSON.stringify({ body: "A's private moment" }),
    });
    expect(created.status).toBe(200);
    const postId = ((await created.json()) as { post: { id: string } }).post.id;

    const attempt = await app.request(`/api/posts/${postId}`, {
      method: "DELETE",
      headers: authHeaders(sessionB),
    });
    expect([403, 404]).toContain(attempt.status);
  });

  it("password reset wipes sessions and kills live access tokens", async () => {
    const member = await createUser({ role: "adult" });
    const session = await signIn(member.email);

    const { generateRandomToken } = await import("../lib/auth.js");
    const { sha256 } = await import("../lib/auth.js");
    const token = generateRandomToken();
    await User.updateOne(
      { _id: member._id },
      {
        $set: {
          resetPasswordTokenHash: sha256(token),
          resetPasswordExpires: new Date(Date.now() + 3600_000),
        },
      },
    );

    const reset = await app.request("/api/auth/reset-password", {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ token, password: "brand-new-password-456" }),
    });
    expect(reset.status).toBe(200);

    expect(
      (await app.request("/api/members", { headers: authHeaders(session) }))
        .status,
    ).toBe(401);
    expect((await doRefresh(session.refreshCookie)).status).toBe(401);
  });
});
