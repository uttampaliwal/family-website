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

interface RoomBody {
  room: {
    id: string;
    name: string;
    createdBy: { name: string };
    lastMessage: { body: string; createdBy: { name: string } } | null;
    unreadCount: number;
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

async function createRoom(session: Session, name: string): Promise<string> {
  const res = await app.request("/api/chat/rooms", {
    method: "POST",
    headers: headers(session.accessToken),
    body: JSON.stringify({ name }),
  });
  expect(res.status).toBe(200);
  const body = (await res.json()) as RoomBody;
  return body.room.id;
}

async function sendMessage(session: Session, roomId: string, body: string) {
  return app.request(`/api/chat/rooms/${roomId}/messages`, {
    method: "POST",
    headers: headers(session.accessToken),
    body: JSON.stringify({ body }),
  });
}

let alice: Awaited<ReturnType<typeof createUser>>;
let bob: Awaited<ReturnType<typeof createUser>>;
let aliceSession: Session;
let bobSession: Session;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri("family-portal"));
  await primeCsrf();

  alice = await createUser("Chat Alice");
  bob = await createUser("Chat Bob", { gender: "female" });
  aliceSession = await signInAs(alice._id.toString());
  bobSession = await signInAs(bob._id.toString());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("chat routes", () => {
  it("requires a bearer token", async () => {
    expect((await app.request("/api/chat/rooms", { headers: headers() })).status).toBe(401);
  });

  it("re-checks approval status on chat routes", async () => {
    const pending = await createUser("Degraded Talker");
    const session = await signInAs(pending._id.toString());
    await User.findByIdAndUpdate(pending._id, { adminApprovalStatus: "pending" });

    const res = await app.request("/api/chat/rooms", { headers: headers(session.accessToken) });
    expect(res.status).toBe(403);
  });

  it("creates a room", async () => {
    const res = await app.request("/api/chat/rooms", {
      method: "POST",
      headers: headers(aliceSession.accessToken),
      body: JSON.stringify({ name: "Diwali planning" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as RoomBody;
    expect(body.room.name).toBe("Diwali planning");
    expect(body.room.createdBy.name).toBe("Chat Alice");
    expect(body.room.unreadCount).toBe(0);
  });

  it("validates room names", async () => {
    const blank = await app.request("/api/chat/rooms", {
      method: "POST",
      headers: headers(aliceSession.accessToken),
      body: JSON.stringify({ name: "  " }),
    });
    expect(blank.status).toBe(422);

    const long = await app.request("/api/chat/rooms", {
      method: "POST",
      headers: headers(aliceSession.accessToken),
      body: JSON.stringify({ name: "x".repeat(61) }),
    });
    expect(long.status).toBe(422);
  });

  it("sends and lists messages newest first", async () => {
    const roomId = await createRoom(aliceSession, "Messages room");

    await sendMessage(aliceSession, roomId, "first");
    await sendMessage(bobSession, roomId, "second");

    const res = await app.request(`/api/chat/rooms/${roomId}/messages`, {
      headers: headers(aliceSession.accessToken),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: { body: string; createdBy: { name: string } }[];
      total: number;
    };
    expect(body.total).toBe(2);
    expect(body.items[0]!.body).toBe("second");
    expect(body.items[0]!.createdBy.name).toBe("Chat Bob");
  });

  it("404s for unknown rooms", async () => {
    const missing = new mongoose.Types.ObjectId().toString();
    expect(
      (await app.request(`/api/chat/rooms/${missing}/messages`, { headers: headers(aliceSession.accessToken) })).status,
    ).toBe(404);
    expect(
      (await sendMessage(aliceSession, missing, "hi")).status,
    ).toBe(404);
  });

  it("tracks unread counts per user and clears them on read", async () => {
    const roomId = await createRoom(aliceSession, "Unread room");

    await sendMessage(aliceSession, roomId, "for bob");
    await sendMessage(aliceSession, roomId, "for bob too");

    const bobList = await app.request("/api/chat/rooms", { headers: headers(bobSession.accessToken) });
    const { items } = (await bobList.json()) as { items: { id: string; unreadCount: number; lastMessage: { body: string } | null }[] };
    const room = items.find((r) => r.id === roomId)!;
    expect(room.unreadCount).toBe(2);
    expect(room.lastMessage?.body).toBe("for bob too");

    await app.request(`/api/chat/rooms/${roomId}/read`, {
      method: "POST",
      headers: headers(bobSession.accessToken),
    });

    const after = await app.request("/api/chat/rooms", { headers: headers(bobSession.accessToken) });
    const { items: refreshed } = (await after.json()) as { items: { id: string; unreadCount: number }[] };
    expect(refreshed.find((r) => r.id === roomId)!.unreadCount).toBe(0);
  });

  it("does not count the viewer's own messages as unread", async () => {
    const roomId = await createRoom(bobSession, "Self room");
    await sendMessage(bobSession, roomId, "my own words");

    const res = await app.request("/api/chat/rooms", { headers: headers(bobSession.accessToken) });
    const { items } = (await res.json()) as { items: { id: string; unreadCount: number }[] };
    expect(items.find((r) => r.id === roomId)!.unreadCount).toBe(0);
  });

  it("streams new messages over SSE", async () => {
    const roomId = await createRoom(aliceSession, "Live room");

    const res = await app.request("/api/chat/events", {
      headers: headers(bobSession.accessToken),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    const posting = sendMessage(aliceSession, roomId, "stream this to me");

    const received = await Promise.race([
      (async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) return false;
          if (decoder.decode(value, { stream: true }).includes('"type":"message"')) return true;
        }
      })(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000)),
    ]);

    expect(received).toBe(true);
    expect((await posting).status).toBe(200);
    await reader.cancel();
  });

  it("rejects empty messages", async () => {
    const roomId = await createRoom(aliceSession, "Validation room");
    const res = await sendMessage(aliceSession, roomId, "   ");
    expect(res.status).toBe(422);
  });
});