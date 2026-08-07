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

async function createUser(name: string, overrides: Record<string, unknown> = {}) {
  const passwordHash = await hashPassword("strong-password-123");
  return User.create({
    name,
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

async function signInAs(userId: string): Promise<Session> {
  const user = await User.findById(userId);
  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email: user!.email, password: "strong-password-123" }),
  });
  if (res.status !== 200) throw new Error(`login failed: ${res.status}`);
  const body = (await res.json()) as { accessToken: string };
  return { accessToken: body.accessToken };
}

interface TreeMemberPayload {
  id: string;
  name: string;
  generation: number;
  parentIds: string[];
  childrenIds: string[];
}

let grandparent: Awaited<ReturnType<typeof createUser>>;
let parent: Awaited<ReturnType<typeof createUser>>;
let child: Awaited<ReturnType<typeof createUser>>;
let unrelated: Awaited<ReturnType<typeof createUser>>;
let adminSession: Session;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri("family-portal"));
  await primeCsrf();

  const admin = await createUser("Tree Admin", { role: "admin" });
  adminSession = await signInAs(admin._id.toString());

  grandparent = await createUser("Grandparent One");
  parent = await createUser("Parent One", { gender: "female" });
  child = await createUser("Child One");
  unrelated = await createUser("Unrelated Cousin");
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("family tree routes", () => {
  it("requires a bearer token", async () => {
    const res = await app.request("/api/members/tree", { headers: headers() });
    expect(res.status).toBe(401);
  });

  it("requires parent or higher role to edit relationships", async () => {
    const session = await signInAs(unrelated._id.toString());
    const res = await app.request(`/api/admin/members/${child._id.toString()}/relationships`, {
      method: "PATCH",
      headers: headers(session.accessToken),
      body: JSON.stringify({ parentIds: [parent._id.toString()] }),
    });
    expect(res.status).toBe(403);
  });

  it("links a member to their parents", async () => {
    const res = await app.request(`/api/admin/members/${parent._id.toString()}/relationships`, {
      method: "PATCH",
      headers: headers(adminSession.accessToken),
      body: JSON.stringify({ parentIds: [grandparent._id.toString()] }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      member: { parentIds: string[] };
    };
    expect(body.member.parentIds).toEqual([grandparent._id.toString()]);

    const childRes = await app.request(`/api/admin/members/${child._id.toString()}/relationships`, {
      method: "PATCH",
      headers: headers(adminSession.accessToken),
      body: JSON.stringify({ parentIds: [parent._id.toString()] }),
    });
    expect(childRes.status).toBe(200);
  });

  it("rejects self-parenting", async () => {
    const res = await app.request(`/api/admin/members/${child._id.toString()}/relationships`, {
      method: "PATCH",
      headers: headers(adminSession.accessToken),
      body: JSON.stringify({ parentIds: [child._id.toString()] }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects unknown parents", async () => {
    const res = await app.request(`/api/admin/members/${child._id.toString()}/relationships`, {
      method: "PATCH",
      headers: headers(adminSession.accessToken),
      body: JSON.stringify({ parentIds: [new mongoose.Types.ObjectId().toString()] }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects pending members as parents", async () => {
    const pending = await createUser("Pending Parent", { adminApprovalStatus: "pending" });
    const res = await app.request(`/api/admin/members/${child._id.toString()}/relationships`, {
      method: "PATCH",
      headers: headers(adminSession.accessToken),
      body: JSON.stringify({ parentIds: [pending._id.toString()] }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects more than two parents", async () => {
    const extra = await createUser("Extra Parent");
    const res = await app.request(`/api/admin/members/${child._id.toString()}/relationships`, {
      method: "PATCH",
      headers: headers(adminSession.accessToken),
      body: JSON.stringify({
        parentIds: [parent._id.toString(), grandparent._id.toString(), extra._id.toString()],
      }),
    });
    expect(res.status).toBe(422);
  });

  it("rejects cyclic links", async () => {
    const a = await createUser("Cycle A");
    const b = await createUser("Cycle B");

    const first = await app.request(`/api/admin/members/${a._id.toString()}/relationships`, {
      method: "PATCH",
      headers: headers(adminSession.accessToken),
      body: JSON.stringify({ parentIds: [b._id.toString()] }),
    });
    expect(first.status).toBe(200);

    const res = await app.request(`/api/admin/members/${b._id.toString()}/relationships`, {
      method: "PATCH",
      headers: headers(adminSession.accessToken),
      body: JSON.stringify({ parentIds: [a._id.toString()] }),
    });
    expect(res.status).toBe(400);
  });

  it("builds the tree with correct generations", async () => {
    await createUser("Hidden Pending", { adminApprovalStatus: "pending" });

    const res = await app.request("/api/members/tree", {
      headers: headers(adminSession.accessToken),
    });
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      roots: string[];
      members: TreeMemberPayload[];
    };

    expect(body.members.some((m) => m.name === "Hidden Pending")).toBe(false);

    const byName = new Map(body.members.map((m) => [m.name, m]));
    const gp = byName.get("Grandparent One")!;
    const p = byName.get("Parent One")!;
    const c = byName.get("Child One")!;
    const u = byName.get("Unrelated Cousin")!;

    expect(gp.generation).toBe(0);
    expect(gp.parentIds).toEqual([]);
    expect(gp.childrenIds).toEqual([parent._id.toString()]);

    expect(p.generation).toBe(1);
    expect(p.parentIds).toEqual([grandparent._id.toString()]);
    expect(p.childrenIds).toEqual([child._id.toString()]);

    expect(c.generation).toBe(2);
    expect(c.parentIds).toEqual([parent._id.toString()]);

    expect(u.generation).toBe(0);
    expect(u.childrenIds).toEqual([]);

    expect(body.roots.sort()).toEqual(
      body.members.filter((m) => m.generation === 0).map((m) => m.id).sort(),
    );
    expect(body.roots).toContain(grandparent._id.toString());
    expect(body.roots).toContain(unrelated._id.toString());
    expect(body.roots).not.toContain(parent._id.toString());
    expect(body.roots).not.toContain(child._id.toString());

    const noPrivate = body.members[0]!;
    expect(noPrivate).not.toHaveProperty("email");
    expect(noPrivate).not.toHaveProperty("phoneNumber");
    expect(noPrivate).not.toHaveProperty("dateOfBirth");
  });
});
