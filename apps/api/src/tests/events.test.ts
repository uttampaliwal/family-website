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

interface EventBody {
  event: {
    id: string;
    title: string;
    type: string;
    startsAt: string;
    endsAt: string | null;
    recurrence: string;
    description: string | null;
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

async function createEvent(
  session: Session,
  body: Record<string, unknown>,
): Promise<EventBody> {
  const res = await app.request("/api/events", {
    method: "POST",
    headers: headers(session.accessToken),
    body: JSON.stringify(body),
  });
  expect(res.status).toBe(200);
  return (await res.json()) as EventBody;
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

  alice = await createUser("Event Alice");
  bob = await createUser("Event Bob", { gender: "female" });
  admin = await createUser("Event Admin", { role: "admin" });
  pending = await createUser("Event Pending");
  aliceSession = await signInAs(alice._id.toString());
  bobSession = await signInAs(bob._id.toString());
  adminSession = await signInAs(admin._id.toString());
  pendingSession = await signInAs(pending._id.toString());
  // Login requires approval, so sign in first, then lock the account.
  await User.updateOne({ _id: pending._id }, { $set: { adminApprovalStatus: "pending" } });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("GET /api/events", () => {
  it("requires authentication", async () => {
    const res = await app.request("/api/events", { headers: headers() });
    expect(res.status).toBe(401);
  });

  it("rejects members whose approval is still pending", async () => {
    const res = await app.request("/api/events", {
      headers: headers(pendingSession.accessToken),
    });
    expect(res.status).toBe(403);
  });

  it("returns an empty list for a fresh calendar", async () => {
    const res = await app.request("/api/events", {
      headers: headers(aliceSession.accessToken),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: unknown[]; total: number };
    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("filters events by [from, to] range", async () => {
    await createEvent(aliceSession, { title: "June picnic", startsAt: "2026-06-10T10:00:00Z" });
    await createEvent(aliceSession, { title: "July picnic", startsAt: "2026-07-10T10:00:00Z" });

    const res = await app.request(
      "/api/events?from=2026-07-01T00:00:00Z&to=2026-07-31T23:59:59Z",
      { headers: headers(aliceSession.accessToken) },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: { title: string }[]; total: number };
    expect(body.items.map((e) => e.title)).toEqual(["July picnic"]);
  });
});

describe("POST /api/events", () => {
  it("creates an event with defaults", async () => {
    const { event } = await createEvent(aliceSession, {
      title: "Grandma's birthday",
      startsAt: "2026-06-15T09:00:00Z",
    });

    expect(event.title).toBe("Grandma's birthday");
    expect(event.type).toBe("gathering");
    expect(event.recurrence).toBe("none");
    expect(event.endsAt).toBeNull();
    expect(event.description).toBeNull();
  });

  it("accepts a yearly birthday with an explicit end time", async () => {
    const { event } = await createEvent(aliceSession, {
      title: "Anniversary",
      type: "anniversary",
      startsAt: "2026-06-18T00:00:00Z",
      endsAt: "2026-06-18T23:59:59Z",
      recurrence: "yearly",
      description: "Fortieth",
    });

    expect(event.type).toBe("anniversary");
    expect(event.recurrence).toBe("yearly");
    expect(event.description).toBe("Fortieth");
    expect(event.endsAt).not.toBeNull();
  });

  it("rejects an invalid start date", async () => {
    const res = await app.request("/api/events", {
      method: "POST",
      headers: headers(aliceSession.accessToken),
      body: JSON.stringify({ title: "No time", startsAt: "not-a-date" }),
    });
    expect(res.status).toBe(422);
  });

  it("rejects an end time before the start time", async () => {
    const res = await app.request("/api/events", {
      method: "POST",
      headers: headers(aliceSession.accessToken),
      body: JSON.stringify({
        title: "Backwards",
        startsAt: "2026-06-20T10:00:00Z",
        endsAt: "2026-06-20T09:00:00Z",
      }),
    });
    expect(res.status).toBe(422);
  });
});

describe("PATCH /api/events/:id", () => {
  it("lets the creator edit their event", async () => {
    const { event } = await createEvent(aliceSession, {
      title: "Before",
      startsAt: "2026-08-01T10:00:00Z",
    });

    const res = await app.request(`/api/events/${event.id}`, {
      method: "PATCH",
      headers: headers(aliceSession.accessToken),
      body: JSON.stringify({ title: "After", recurrence: "yearly" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as EventBody;
    expect(body.event.title).toBe("After");
    expect(body.event.recurrence).toBe("yearly");
  });

  it("forbids a non-creator non-admin from editing", async () => {
    const { event } = await createEvent(aliceSession, {
      title: "Private",
      startsAt: "2026-08-02T10:00:00Z",
    });

    const res = await app.request(`/api/events/${event.id}`, {
      method: "PATCH",
      headers: headers(bobSession.accessToken),
      body: JSON.stringify({ title: "Hijacked" }),
    });
    expect(res.status).toBe(403);
  });

  it("lets an admin edit anyone's event", async () => {
    const { event } = await createEvent(bobSession, {
      title: "Bob's thing",
      startsAt: "2026-08-03T10:00:00Z",
    });

    const res = await app.request(`/api/events/${event.id}`, {
      method: "PATCH",
      headers: headers(adminSession.accessToken),
      body: JSON.stringify({ title: "Bob's thing (moved)" }),
    });
    expect(res.status).toBe(200);
  });

  it("returns 404 for an unknown event", async () => {
    const res = await app.request("/api/events/000000000000000000000000", {
      method: "PATCH",
      headers: headers(aliceSession.accessToken),
      body: JSON.stringify({ title: "Ghost" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/events/:id", () => {
  it("lets the creator delete their event", async () => {
    const { event } = await createEvent(aliceSession, {
      title: "Remove me",
      startsAt: "2026-08-04T10:00:00Z",
    });

    const res = await app.request(`/api/events/${event.id}`, {
      method: "DELETE",
      headers: headers(aliceSession.accessToken),
    });
    expect(res.status).toBe(200);

    const gone = await app.request(`/api/events/${event.id}`, {
      headers: headers(aliceSession.accessToken),
    });
    expect(gone.status).toBe(404);
  });

  it("rejects a non-creator deleting someone else's event", async () => {
    const { event } = await createEvent(aliceSession, {
      title: "Keep me",
      startsAt: "2026-08-05T10:00:00Z",
    });

    const res = await app.request(`/api/events/${event.id}`, {
      method: "DELETE",
      headers: headers(bobSession.accessToken),
    });
    expect(res.status).toBe(403);
  });
});