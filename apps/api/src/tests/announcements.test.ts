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

interface AnnouncementBody {
  announcement: {
    id: string;
    title: string;
    body: string;
    createdBy: { id: string; name: string; username: string };
  };
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

async function createAnnouncement(session: Session, body: Record<string, unknown>) {
  const res = await app.request("/api/announcements", {
    method: "POST",
    headers: headers(session.accessToken),
    body: JSON.stringify(body),
  });
  return res;
}

describe("announcements", () => {
  let admin: Session;
  let member: Session;
  let pending: Session;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());

    await primeCsrf();

    const adminUser = await createUser("Aunt Shalini", { role: "admin" });
    const memberUser = await createUser("Cousin Raj");
    const pendingUser = await createUser("Unverified Nephew");

    admin = await signInAs(adminUser._id.toString());
    member = await signInAs(memberUser._id.toString());
    pending = await signInAs(pendingUser._id.toString());

    // Login rejects pending accounts, so flip the status after signing in.
    await User.findByIdAndUpdate(pendingUser._id, { adminApprovalStatus: "pending" });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("requires authentication", async () => {
    const res = await app.request("/api/announcements");
    expect(res.status).toBe(401);
  });

  it("rejects pending members", async () => {
    const res = await app.request("/api/announcements", {
      headers: headers(pending.accessToken),
    });
    expect(res.status).toBe(403);
  });

  it("returns an empty list initially", async () => {
    const res = await app.request("/api/announcements", {
      headers: headers(member.accessToken),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: unknown[]; total: number };
    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("lets an admin create an announcement", async () => {
    const res = await createAnnouncement(admin, {
      title: "Family picnic",
      body: "Sunday at the park, bring snacks.",
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as AnnouncementBody;
    expect(body.announcement.title).toBe("Family picnic");
    expect(body.announcement.body).toBe("Sunday at the park, bring snacks.");
    expect(body.announcement.createdBy.name).toBe("Aunt Shalini");
  });

  it("rejects a non-admin creating an announcement", async () => {
    const res = await createAnnouncement(member, { title: "Hello", body: "world" });
    expect(res.status).toBe(403);
  });

  it("validates the body", async () => {
    const missingTitle = await createAnnouncement(admin, { body: "No title here" });
    expect(missingTitle.status).toBe(422);

    const emptyBody = await createAnnouncement(admin, { title: "No body" });
    expect(emptyBody.status).toBe(422);

    const tooLong = await createAnnouncement(admin, {
      title: "Too long",
      body: "x".repeat(2001),
    });
    expect(tooLong.status).toBe(422);
  });

  it("lists newest first", async () => {
    await createAnnouncement(admin, { title: "Second post", body: "later" });
    const res = await app.request("/api/announcements", {
      headers: headers(member.accessToken),
    });
    const body = (await res.json()) as { items: AnnouncementBody["announcement"][]; total: number };
    expect(body.total).toBe(2);
    expect(body.items[0]!.title).toBe("Second post");
    expect(body.items[1]!.title).toBe("Family picnic");
  });

  it("fetches a single announcement and 404s for unknown ids", async () => {
    const list = await app.request("/api/announcements", {
      headers: headers(member.accessToken),
    });
    const { items } = (await list.json()) as { items: AnnouncementBody["announcement"][] };
    const id = items[0]!.id;

    const res = await app.request(`/api/announcements/${id}`, {
      headers: headers(member.accessToken),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as AnnouncementBody;
    expect(body.announcement.id).toBe(id);

    const missing = await app.request(
      `/api/announcements/${new mongoose.Types.ObjectId().toString()}`,
      { headers: headers(member.accessToken) },
    );
    expect(missing.status).toBe(404);
  });

  it("lets an admin edit an announcement", async () => {
    const list = await app.request("/api/announcements", {
      headers: headers(member.accessToken),
    });
    const { items } = (await list.json()) as { items: AnnouncementBody["announcement"][] };
    const id = items[0]!.id;

    const res = await app.request(`/api/announcements/${id}`, {
      method: "PATCH",
      headers: headers(admin.accessToken),
      body: JSON.stringify({ title: "Edited title" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as AnnouncementBody;
    expect(body.announcement.title).toBe("Edited title");
    expect(body.announcement.body).toBe("later");
  });

  it("rejects a non-admin editing", async () => {
    const list = await app.request("/api/announcements", {
      headers: headers(member.accessToken),
    });
    const { items } = (await list.json()) as { items: AnnouncementBody["announcement"][] };

    const res = await app.request(`/api/announcements/${items[0]!.id}`, {
      method: "PATCH",
      headers: headers(member.accessToken),
      body: JSON.stringify({ title: "Hijacked" }),
    });
    expect(res.status).toBe(403);
  });

  it("404s when patching an unknown announcement", async () => {
    const res = await app.request(
      `/api/announcements/${new mongoose.Types.ObjectId().toString()}`,
      {
        method: "PATCH",
        headers: headers(admin.accessToken),
        body: JSON.stringify({ title: "Ghost" }),
      },
    );
    expect(res.status).toBe(404);
  });

  it("lets an admin delete, then 404s on the deleted id", async () => {
    const list = await app.request("/api/announcements", {
      headers: headers(member.accessToken),
    });
    const { items } = (await list.json()) as { items: AnnouncementBody["announcement"][] };

    const res = await app.request(`/api/announcements/${items[0]!.id}`, {
      method: "DELETE",
      headers: headers(admin.accessToken),
    });
    expect(res.status).toBe(200);

    const gone = await app.request(`/api/announcements/${items[0]!.id}`, {
      headers: headers(member.accessToken),
    });
    expect(gone.status).toBe(404);
  });

  it("rejects a non-admin deleting", async () => {
    const list = await app.request("/api/announcements", {
      headers: headers(member.accessToken),
    });
    const { items } = (await list.json()) as { items: AnnouncementBody["announcement"][] };

    const res = await app.request(`/api/announcements/${items[0]!.id}`, {
      method: "DELETE",
      headers: headers(member.accessToken),
    });
    expect(res.status).toBe(403);
  });
});
