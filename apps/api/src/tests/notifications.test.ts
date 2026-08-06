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

interface NotificationItem {
  id: string;
  type: string;
  actor: { id: string; name: string } | null;
  body: string;
  link: string;
  readAt: string | null;
  createdAt: string;
}

interface NotificationListBody {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
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

async function myNotifications(
  session: Session,
): Promise<NotificationListBody> {
  const res = await app.request("/api/notifications", {
    headers: headers(session.accessToken),
  });
  expect(res.status).toBe(200);
  return (await res.json()) as NotificationListBody;
}

async function unreadCount(session: Session): Promise<number> {
  const res = await app.request("/api/notifications/unread-count", {
    headers: headers(session.accessToken),
  });
  expect(res.status).toBe(200);
  const body = (await res.json()) as { count: number };
  return body.count;
}

let alice: Awaited<ReturnType<typeof createUser>>;
let bob: Awaited<ReturnType<typeof createUser>>;
let admin: Awaited<ReturnType<typeof createUser>>;
let pending: Awaited<ReturnType<typeof createUser>>;
let aliceSession: Session;
let bobSession: Session;
let adminSession: Session;
let pendingSession: Session;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri("family-portal"));
  await primeCsrf();

  alice = await createUser("Note Alice");
  bob = await createUser("Note Bob", { gender: "female" });
  admin = await createUser("Note Admin", { role: "admin" });
  pending = await createUser("Note Pending");
  aliceSession = await signInAs(alice._id.toString());
  bobSession = await signInAs(bob._id.toString());
  adminSession = await signInAs(admin._id.toString());
  // Login requires approval, so sign in first, then lock the account.
  pendingSession = await signInAs(pending._id.toString());
  await User.updateOne({ _id: pending._id }, { $set: { adminApprovalStatus: "pending" } });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("notifications access control", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await app.request("/api/notifications");
    expect(res.status).toBe(401);
  });

  it("rejects unapproved members", async () => {
    const res = await app.request("/api/notifications", {
      headers: headers(pendingSession.accessToken),
    });
    expect(res.status).toBe(403);
  });
});

describe("notification triggers", () => {
  it("notifies members when an announcement is published", async () => {
    const res = await app.request("/api/announcements", {
      method: "POST",
      headers: headers(adminSession.accessToken),
      body: JSON.stringify({ title: "Diwali plan", body: "We gather on Nov 1." }),
    });
    expect(res.status).toBe(200);

    const body = await myNotifications(bobSession);
    const notification = body.items.find((n) => n.type === "announcement");
    expect(notification).toBeDefined();
    expect(notification!.body).toBe("Diwali plan");
    expect(notification!.link).toBe("/announcements");
    expect(notification!.actor?.name).toBe("Note Admin");
    expect(body.unreadCount).toBeGreaterThanOrEqual(1);
  });

  it("does not notify the author of their own announcement", async () => {
    const body = await myNotifications(adminSession);
    expect(body.items.some((n) => n.body === "Diwali plan")).toBe(false);
  });

  it("notifies members when an event is created", async () => {
    const res = await app.request("/api/events", {
      method: "POST",
      headers: headers(aliceSession.accessToken),
      body: JSON.stringify({
        title: "Nana's birthday",
        type: "birthday",
        startsAt: "2026-09-01T10:00:00.000Z",
      }),
    });
    expect(res.status).toBe(200);

    const body = await myNotifications(bobSession);
    const notification = body.items.find((n) => n.type === "event");
    expect(notification).toBeDefined();
    expect(notification!.body).toBe("Nana's birthday");
    expect(notification!.link).toBe("/events");
  });

  it("notifies the moment author when someone likes their moment", async () => {
    const created = await app.request("/api/posts", {
      method: "POST",
      headers: headers(aliceSession.accessToken),
      body: JSON.stringify({ body: "First steps at the park" }),
    });
    expect(created.status).toBe(200);
    const post = (await created.json()) as { post: { id: string } };

    const like = await app.request(`/api/posts/${post.post.id}/like`, {
      method: "POST",
      headers: headers(bobSession.accessToken),
      body: JSON.stringify({}),
    });
    expect(like.status).toBe(200);

    const body = await myNotifications(aliceSession);
    const notification = body.items.find((n) => n.type === "moment_like");
    expect(notification).toBeDefined();
    expect(notification!.actor?.name).toBe("Note Bob");
    expect(notification!.link).toBe("/moments");
  });

  it("does not notify the author when they like their own moment", async () => {
    const created = await app.request("/api/posts", {
      method: "POST",
      headers: headers(aliceSession.accessToken),
      body: JSON.stringify({ body: "Self like check" }),
    });
    expect(created.status).toBe(200);
    const post = (await created.json()) as { post: { id: string } };

    const before = (await myNotifications(aliceSession)).total;
    const like = await app.request(`/api/posts/${post.post.id}/like`, {
      method: "POST",
      headers: headers(aliceSession.accessToken),
      body: JSON.stringify({}),
    });
    expect(like.status).toBe(200);

    const after = (await myNotifications(aliceSession)).total;
    expect(after).toBe(before);
  });

  it("notifies the moment author when someone comments", async () => {
    const created = await app.request("/api/posts", {
      method: "POST",
      headers: headers(aliceSession.accessToken),
      body: JSON.stringify({ body: "Holi party moments" }),
    });
    const post = (await created.json()) as { post: { id: string } };

    const comment = await app.request(`/api/posts/${post.post.id}/comments`, {
      method: "POST",
      headers: headers(bobSession.accessToken),
      body: JSON.stringify({ body: "So much colour!" }),
    });
    expect(comment.status).toBe(200);

    const body = await myNotifications(aliceSession);
    const notification = body.items.find((n) => n.type === "moment_comment");
    expect(notification).toBeDefined();
    expect(notification!.actor?.name).toBe("Note Bob");
    expect(notification!.body).toBe("So much colour!");
  });

  it("notifies admins when a new member registers", async () => {
    const register = await app.request("/api/auth/register", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        name: "New Cousin",
        email: `${Date.now()}_cousin@example.com`,
        username: `cousin_${Date.now().toString(36)}`,
        password: "strong-password-123",
        dateOfBirth: "1998-03-03",
        gender: "female",
        relationship: "daughter",
      }),
    });
    expect(register.status).toBe(201);

    const body = await myNotifications(adminSession);
    const notification = body.items.find((n) => n.type === "member_joined");
    expect(notification).toBeDefined();
    expect(notification!.actor?.name).toBe("New Cousin");
    expect(notification!.link).toBe("/admin/approvals");
  });

  it("notifies the member when an admin approves their account", async () => {
    const approve = await app.request(`/api/admin/members/${pending._id.toString()}`, {
      method: "PATCH",
      headers: headers(adminSession.accessToken),
      body: JSON.stringify({ status: "approved" }),
    });
    expect(approve.status).toBe(200);

    const pendingSession = await signInAs(pending._id.toString());
    const body = await myNotifications(pendingSession);
    const notification = body.items.find((n) => n.type === "approval");
    expect(notification).toBeDefined();
    expect(notification!.actor?.name).toBe("Note Admin");
  });
});

describe("notification read state", () => {
  it("marks a single notification as read", async () => {
    const before = await unreadCount(bobSession);
    const body = await myNotifications(bobSession);
    const notification = body.items.find((n) => !n.readAt);
    expect(notification).toBeDefined();

    const res = await app.request(`/api/notifications/${notification!.id}/read`, {
      method: "POST",
      headers: headers(bobSession.accessToken),
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
    expect(await unreadCount(bobSession)).toBe(before - 1);
  });

  it("forbids marking someone else's notification as read", async () => {
    const body = await myNotifications(bobSession);
    const res = await app.request(`/api/notifications/${body.items[0]!.id}/read`, {
      method: "POST",
      headers: headers(aliceSession.accessToken),
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(403);
  });

  it("marks all notifications as read", async () => {
    const res = await app.request("/api/notifications/read-all", {
      method: "POST",
      headers: headers(bobSession.accessToken),
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
    expect(await unreadCount(bobSession)).toBe(0);

    const body = await myNotifications(bobSession);
    expect(body.items.every((n) => n.readAt !== null)).toBe(true);
  });

  it("dismisses a notification", async () => {
    const body = await myNotifications(bobSession);
    const notification = body.items[0]!;

    const res = await app.request(`/api/notifications/${notification.id}`, {
      method: "DELETE",
      headers: headers(bobSession.accessToken),
    });
    expect(res.status).toBe(200);

    const after = await myNotifications(bobSession);
    expect(after.items.some((n) => n.id === notification.id)).toBe(false);
  });
});
