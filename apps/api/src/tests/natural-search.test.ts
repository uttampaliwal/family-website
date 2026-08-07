import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { hashPassword } from "../lib/passwords.js";
import { User } from "../models/user.js";
import { Photo } from "../models/photo.js";
import { KulayaDocument } from "../models/document.js";

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

async function ask(session: Session, qs: string) {
  return app.request(`/api/search/nl${qs}`, { headers: headers(session.accessToken) });
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

describe("natural-language search endpoint", () => {
  it("requires a bearer token", async () => {
    const res = await app.request("/api/search/nl?q=diwali", { headers: headers() });
    expect(res.status).toBe(401);
  });

  it("re-checks approval status", async () => {
    const pending = await createUser("Ghost Member");
    const session = await signInAs(pending._id.toString());
    await User.findByIdAndUpdate(pending._id, { adminApprovalStatus: "pending" });

    const res = await ask(session, "?q=diwali");
    expect(res.status).toBe(403);
  });

  it("validates the query", async () => {
    expect((await ask(aliceSession, "")).status).toBe(400);
    expect((await ask(aliceSession, "?q=")).status).toBe(400);
    expect((await ask(aliceSession, `?q=${"x".repeat(201)}`)).status).toBe(400);
  });

  it("'show photos from Diwali' routes to photos with a keyword", async () => {
    await Photo.create({
      key: `photos/diwali-${Date.now()}.jpg`,
      mimeType: "image/jpeg",
      size: 1024,
      caption: "Diwali lights on the terrace",
      uploadedBy: alice._id,
    });
    await Photo.create({
      key: `photos/trip-${Date.now()}.jpg`,
      mimeType: "image/jpeg",
      size: 1024,
      caption: "Beach with the cousins",
      uploadedBy: alice._id,
    });

    const res = await ask(aliceSession, "?q=show%20photos%20from%20Diwali");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      intent: string;
      filters: { dataset: string; keywords?: string };
      photos: { id: string; caption: string }[];
    };
    expect(body.intent).toBe("photos");
    expect(body.filters.dataset).toBe("photos");
    expect(body.filters.keywords).toBe("diwali");
    expect(body.photos.map((p) => p.caption)).toContain("Diwali lights on the terrace");
    expect(body.photos.some((p) => p.caption === "Beach with the cousins")).toBe(false);
  });

  it("'find passport' finds documents by name/description", async () => {
    await KulayaDocument.create({
      key: `documents/${Date.now()}-passport.pdf`,
      name: "Passport-copies.pdf",
      mimeType: "application/pdf",
      size: 2048,
      description: "scans for the Australia visit",
      uploadedBy: alice._id,
    });
    await KulayaDocument.create({
      key: `documents/${Date.now()}-recipe.pdf`,
      name: "dhokla-recipe.pdf",
      mimeType: "application/pdf",
      size: 1024,
      uploadedBy: alice._id,
    });

    const res = await ask(aliceSession, "?q=find%20passport");
    const body = (await res.json()) as {
      intent: string;
      documents: { name: string; description: string | null }[];
    };
    expect(body.intent).toBe("documents");
    expect(body.documents.map((d) => d.name)).toContain("Passport-copies.pdf");
    expect(body.documents.some((d) => d.name === "dhokla-recipe.pdf")).toBe(false);
  });

  it("'show documents shared with me' lists documents without a keyword", async () => {
    const res = await ask(aliceSession, "?q=show%20documents%20shared%20with%20me");
    const body = (await res.json()) as {
      intent: string;
      filters: { dataset: string; keywords?: string };
      documents: { name: string }[];
    };
    expect(body.intent).toBe("documents");
    expect(body.filters.dataset).toBe("documents");
    expect(body.filters.keywords).toBeUndefined();
    expect(body.documents.map((d) => d.name)).toContain("dhokla-recipe.pdf");
  });

  it("answers a person's birthday question", async () => {
    await createUser("Grandma Prema", {
      dateOfBirth: new Date("1948-03-15"),
    });

    const res = await ask(aliceSession, "?q=when%20is%20Grandma%20Prema%20birthday");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      intent: string;
      answer: {
        kind: string;
        member: { name: string; dateOfBirth: string };
        nextOccurrence: string;
        daysUntil: number;
      };
    };
    expect(body.intent).toBe("birthday");
    expect(body.answer.kind).toBe("birthday");
    expect(body.answer.member.name).toBe("Grandma Prema");
    expect(new Date(body.answer.member.dateOfBirth).getFullYear()).toBe(1948);
  });

  it("restricts photos to the named person", async () => {
    const bob = await createUser("Uncle Bob");
    const carol = await createUser("Aunt Carol");

    const bobPhoto = await Photo.create({
      key: `photos/bob-di-wali-${Date.now()}.jpg`,
      mimeType: "image/jpeg",
      size: 512,
      caption: "diwali crackers with the kids",
      uploadedBy: bob._id,
    });
    const carolPhoto = await Photo.create({
      key: `photos/carol-di-wali-${Date.now()}.jpg`,
      mimeType: "image/jpeg",
      size: 512,
      caption: "diwali rangoli downstairs",
      uploadedBy: carol._id,
    });

    const res = await ask(aliceSession, "?q=show%20photos%20of%20Uncle%20Bob");
    const body = (await res.json()) as {
      filters: { personName?: string; personId?: string };
      photos: { id: string }[];
    };
    expect(body.filters.personName).toBe("Uncle Bob");
    expect(body.photos.map((p) => p.id)).toContain(bobPhoto._id.toString());
    expect(body.photos.map((p) => p.id)).not.toContain(carolPhoto._id.toString());
  });
});