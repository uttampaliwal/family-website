import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { hashPassword } from "../lib/passwords.js";
import { User } from "../models/user.js";

let mongo: MongoMemoryServer;
let csrfToken: string;
const cookies: Record<string, string> = {};

const app = createApp();

interface Session {
  accessToken: string;
  userId: string;
  isAdmin: boolean;
}

async function primeCsrf() {
  const res = await app.request("/api/auth/csrf-token");
  const setCookie = res.headers.getSetCookie()[0] ?? "";
  const match = /kulaya_csrf=([^;]+)/.exec(setCookie);
  csrfToken = match ? decodeURIComponent(match[1]!) : "";
  cookies.kulaya_csrf = csrfToken;
}

function headers(token?: string) {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Cookie: Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; "),
  };
  if (csrfToken) h["X-CSRF-Token"] = csrfToken;
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function createUser(overrides: Record<string, unknown> = {}) {
  const passwordHash = await hashPassword("strong-password-123");
  return User.create({
    name: "Test Member",
    email: `${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`,
    username: `user_${Math.random().toString(36).slice(2, 9)}`,
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

async function signInAs(userId: string, password = "strong-password-123"): Promise<Session> {
  const user = await User.findById(userId);
  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email: user!.email, password }),
  });
  if (res.status !== 200) throw new Error(`login failed: ${res.status}`);
  const body = (await res.json()) as { user: { id: string }; accessToken: string };
  return { accessToken: body.accessToken, userId: body.user.id, isAdmin: false };
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

describe("members routes", () => {
  it("requires a bearer token", async () => {
    const res = await app.request("/api/members", { headers: headers() });
    expect(res.status).toBe(401);
  });

  it("lists approved members without private fields", async () => {
    const alice = await createUser({ name: "Alice Member" });
    await createUser({ name: "Bob Member", gender: "female" });
    await createUser({ adminApprovalStatus: "pending" });

    const session = await signInAs(alice._id.toString());
    const res = await app.request("/api/members", { headers: headers(session.accessToken) });
    expect(res.status).toBe(200);

    const body = (await res.json()) as { items: Record<string, unknown>[]; total: number };
    expect(body.total).toBe(2);
    const names = body.items.map((m) => m.name).sort();
    expect(names).toEqual(["Alice Member", "Bob Member"]);

    const first = body.items.find((m) => m.name === "Alice Member")!;
    expect(first).not.toHaveProperty("email");
    expect(first).not.toHaveProperty("phoneNumber");
    expect(first).not.toHaveProperty("dateOfBirth");
    expect(first).toHaveProperty("joinedAt");
  });

  it("searches members by name", async () => {
    await createUser({ name: "Zara Zee" });
    const alice = await User.findOne({ name: "Alice Member" });
    const session = await signInAs(alice!._id.toString());
    const res = await app.request("/api/members?search=zara", {
      headers: headers(session.accessToken),
    });
    const body = (await res.json()) as { items: { name: string }[]; total: number };
    expect(body.total).toBe(1);
    expect(body.items[0]!.name).toBe("Zara Zee");
  });

  it("hides pending members from single-member lookups", async () => {
    const pending = await createUser({ adminApprovalStatus: "pending" });
    const alice = await User.findOne({ name: "Alice Member" });
    const session = await signInAs(alice!._id.toString());
    const res = await app.request(`/api/members/${pending._id.toString()}`, {
      headers: headers(session.accessToken),
    });
    expect(res.status).toBe(404);
  });

  it("lets members update their own profile", async () => {
    const alice = await User.findOne({ name: "Alice Member" });
    const session = await signInAs(alice!._id.toString());
    const res = await app.request("/api/members/me", {
      method: "PATCH",
      headers: headers(session.accessToken),
      body: JSON.stringify({ relationship: "daughter", phoneNumber: "+919876543210" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { member: { relationship: string; phoneNumber: string } };
    expect(body.member.relationship).toBe("daughter");
    expect(body.member).not.toHaveProperty("phoneNumber");

    const reloaded = await User.findById(alice!._id);
    expect(reloaded!.phoneNumber).toBe("+919876543210");
  });
});

describe("admin routes", () => {
  let adminSession: Session;
  let memberSession: Session;
  let pendingUser: Awaited<ReturnType<typeof createUser>>;

  beforeAll(async () => {
    const admin = await createUser({ role: "admin", name: "Admin One" });
    adminSession = await signInAs(admin._id.toString());
    pendingUser = await createUser({
      name: "Newbie Member",
      adminApprovalStatus: "pending",
      isVerified: false,
    });
  });

  it("requires admin role", async () => {
    const alice = await User.findOne({ name: "Alice Member" });
    memberSession = await signInAs(alice!._id.toString());
    const res = await app.request("/api/admin/members", {
      headers: headers(memberSession.accessToken),
    });
    expect(res.status).toBe(403);
  });

  it("lists pending members for review", async () => {
    const res = await app.request("/api/admin/members?status=pending", {
      headers: headers(adminSession.accessToken),
    });
    if (res.status !== 200) console.log("ADMIN-LIST-ERR", res.status, await res.text());
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: { email: string; adminApprovalStatus: string }[];
      total: number;
    };
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.items[0]).toHaveProperty("email");
    expect(body.items[0]!.adminApprovalStatus).toBe("pending");
  });

  it("reports the pending count", async () => {
    const res = await app.request("/api/admin/members/pending-count", {
      headers: headers(adminSession.accessToken),
    });
    const body = (await res.json()) as { count: number };
    expect(body.count).toBeGreaterThanOrEqual(1);
  });

  it("approves a member", async () => {
    const res = await app.request(`/api/admin/members/${pendingUser._id.toString()}`, {
      method: "PATCH",
      headers: headers(adminSession.accessToken),
      body: JSON.stringify({ status: "approved" }),
    });
    expect(res.status).toBe(200);
    const reloaded = await User.findById(pendingUser._id);
    expect(reloaded!.adminApprovalStatus).toBe("approved");
    expect(reloaded!.approvedAt).toBeInstanceOf(Date);
  });

  it("rejects an empty decision body", async () => {
    const res = await app.request(`/api/admin/members/${pendingUser._id.toString()}`, {
      method: "PATCH",
      headers: headers(adminSession.accessToken),
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(422);
  });

  it("prevents admins from reviewing themselves", async () => {
    const res = await app.request(`/api/admin/members/${adminSession.userId}`, {
      method: "PATCH",
      headers: headers(adminSession.accessToken),
      body: JSON.stringify({ status: "rejected" }),
    });
    expect(res.status).toBe(400);
  });
});
