import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { hashPassword } from "../lib/passwords.js";
import { User } from "../models/user.js";
import { Photo } from "../models/photo.js";
import { Post } from "../models/post.js";
import { Event } from "../models/event.js";
import { KulayaDocument } from "../models/document.js";
import { ChatMessage } from "../models/message.js";
import { Room } from "../models/room.js";

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

async function search(session: Session, qs: string) {
  return app.request(`/api/search${qs}`, { headers: headers(session.accessToken) });
}

let alice: Awaited<ReturnType<typeof createUser>>;
let aliceSession: Session;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri("family-portal"));
  await primeCsrf();

  alice = await createUser("Mom Alice", { username: "alice_mom" });
  aliceSession = await signInAs(alice._id.toString());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("search routes", () => {
  it("requires a bearer token", async () => {
    const res = await app.request("/api/search?q=test", { headers: headers() });
    expect(res.status).toBe(401);
  });

  it("re-checks approval status", async () => {
    const pending = await createUser("Ghost Member");
    const session = await signInAs(pending._id.toString());
    await User.findByIdAndUpdate(pending._id, { adminApprovalStatus: "pending" });

    const res = await search(session, "?q=test");
    expect(res.status).toBe(403);
  });

  it("validates the query", async () => {
    expect((await search(aliceSession, "")).status).toBe(400);
    expect((await search(aliceSession, "?q=")).status).toBe(400);
    expect((await search(aliceSession, "?q=%20%20")).status).toBe(400);
    expect((await search(aliceSession, `?q=${"x".repeat(101)}`)).status).toBe(400);
  });

  it("finds people by name or username, only approved ones", async () => {
    await createUser("Hidden Uncle", { adminApprovalStatus: "pending" });

    const byName = await search(aliceSession, "?q=alice");
    const byNameBody = (await byName.json()) as { people: { name: string }[] };
    expect(byName.status).toBe(200);
    expect(byNameBody.people.map((p) => p.name)).toContain("Mom Alice");

    const byUsername = await search(aliceSession, "?q=alice_mom");
    const byUsernameBody = (await byUsername.json()) as { people: { username: string }[] };
    expect(byUsernameBody.people.map((p) => p.username)).toContain("alice_mom");

    const pendingSearch = await search(aliceSession, "?q=hidden");
    const pendingBody = (await pendingSearch.json()) as { people: unknown[] };
    expect(pendingBody.people).toEqual([]);
  });

  it("searches moments, events, documents and chat messages", async () => {
    const post = await Post.create({
      body: "The dhaba run for chai at 5am",
      createdBy: alice._id,
    });
    const event = await Event.create({
      title: "Grand Diwali dinner",
      type: "gathering",
      startsAt: new Date(),
      description: "Chai and crackers at dusk",
      createdBy: alice._id,
    });
    const document = await KulayaDocument.create({
      key: "documents/dhaba-recipes.pdf",
      name: "dhaba-recipes.pdf",
      mimeType: "application/pdf",
      size: 1234,
      description: "Mama's secret chai recipe",
      uploadedBy: alice._id,
    });
    const room = await Room.create({ name: "Kitchen Talk", createdBy: alice._id });
    const message = await ChatMessage.create({
      roomId: room._id,
      body: "Don't forget the milk for chai",
      createdBy: alice._id,
    });

    const res = await search(aliceSession, "?q=chai");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      posts: { id: string; body: string }[];
      events: { id: string; title: string }[];
      documents: { id: string; name: string }[];
      messages: { id: string; body: string }[];
    };

    expect(body.posts.map((p) => p.id)).toContain(post._id.toString());
    expect(body.events.map((e) => e.id)).toContain(event._id.toString());
    expect(body.documents.map((d) => d.id)).toContain(document._id.toString());
    expect(body.messages.map((m) => m.id)).toContain(message._id.toString());
  });

  it("searches photos by caption", async () => {
    const photo = await Photo.create({
      key: `photos/test-${Date.now()}.jpg`,
      mimeType: "image/jpeg",
      size: 1024,
      caption: "Rooftop festival lights",
      uploadedBy: alice._id,
    });

    const res = await search(aliceSession, "?q=festival");
    const body = (await res.json()) as {
      photos: { id: string; caption: string; uploadedBy: { name: string } }[];
    };
    expect(res.status).toBe(200);
    expect(body.photos.map((p) => p.id)).toContain(photo._id.toString());
    expect(body.photos[0]!.uploadedBy.name).toBe("Mom Alice");
  });

  it("caps each group at the requested limit", async () => {
    await Promise.all(
      ["One", "Two", "Three"].map((suffix) =>
        Event.create({
          title: `Shared birthday ${suffix}`,
          type: "birthday",
          startsAt: new Date(),
          createdBy: alice._id,
        }),
      ),
    );

    const res = await search(aliceSession, "?q=shared&limit=2");
    const body = (await res.json()) as { events: unknown[] };
    expect(body.events).toHaveLength(2);
  });

  it("treats the query as literal text, not a regex pattern", async () => {
    const res = await search(aliceSession, "?q=gr.nd");
    const body = (await res.json()) as { events: { title: string }[] };
    expect(body.events.find((e) => e.title === "Grand Diwali dinner")).toBeUndefined();
  });

  it("returns empty groups when nothing matches", async () => {
    const res = await search(aliceSession, "?q=zzzqqq");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      people: unknown[];
      photos: unknown[];
      posts: unknown[];
      events: unknown[];
      documents: unknown[];
      messages: unknown[];
    };
    expect(body).toEqual({
      q: "zzzqqq",
      people: [],
      photos: [],
      posts: [],
      events: [],
      documents: [],
      messages: [],
    });
  });
});
