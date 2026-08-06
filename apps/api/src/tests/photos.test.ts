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

/** Full happy path: request URL → PUT bytes → register → returns photo. */
async function uploadPhoto(
  session: Session,
  bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
  mimeType = "image/jpeg",
): Promise<{ id: string; url: string }> {
  const urlRes = await app.request("/api/photos/upload-url", {
    method: "POST",
    headers: headers(session.accessToken),
    body: JSON.stringify({ mimeType, size: bytes.byteLength }),
  });
  expect(urlRes.status).toBe(200);
  const { uploadUrl, key } = (await urlRes.json()) as { uploadUrl: string; key: string };

  const putRes = await app.request(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: bytes,
  });
  expect(putRes.status).toBe(200);

  const createRes = await app.request("/api/photos", {
    method: "POST",
    headers: headers(session.accessToken),
    body: JSON.stringify({ key, mimeType, size: bytes.byteLength, caption: "Test shot" }),
  });
  expect(createRes.status).toBe(200);
  const body = (await createRes.json()) as { photo: { id: string; url: string; caption: string } };
  expect(body.photo.caption).toBe("Test shot");
  return { id: body.photo.id, url: body.photo.url };
}

let alice: Awaited<ReturnType<typeof createUser>>;
let bob: Awaited<ReturnType<typeof createUser>>;
let admin: Awaited<ReturnType<typeof createUser>>;
let aliceSession: Session;
let bobSession: Session;
let adminSession: Session;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri("family-portal"));
  await primeCsrf();

  alice = await createUser("Photo Alice");
  bob = await createUser("Photo Bob", { gender: "female" });
  admin = await createUser("Photo Admin", { role: "admin" });
  aliceSession = await signInAs(alice._id.toString());
  bobSession = await signInAs(bob._id.toString());
  adminSession = await signInAs(admin._id.toString());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("photos routes", () => {
  it("requires a bearer token", async () => {
    const res = await app.request("/api/photos", { headers: headers() });
    expect(res.status).toBe(401);
  });

  it("re-checks approval status on photo routes", async () => {
    const pending = await createUser("Degraded Photographer");
    const session = await signInAs(pending._id.toString());

    await User.findByIdAndUpdate(pending._id, { adminApprovalStatus: "pending" });

    const res = await app.request("/api/photos", { headers: headers(session.accessToken) });
    expect(res.status).toBe(403);
  });

  it("rejects oversized uploads", async () => {
    const res = await app.request("/api/photos/upload-url", {
      method: "POST",
      headers: headers(aliceSession.accessToken),
      body: JSON.stringify({ mimeType: "image/jpeg", size: 21 * 1024 * 1024 }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects unsupported mime types", async () => {
    const res = await app.request("/api/photos/upload-url", {
      method: "POST",
      headers: headers(aliceSession.accessToken),
      body: JSON.stringify({ mimeType: "image/svg+xml", size: 100 }),
    });
    expect(res.status).toBe(400);
  });

  it("registers a photo after the direct upload", async () => {
    const { url } = await uploadPhoto(aliceSession);
    expect(url).toContain("/api/uploads/photos/");
  });

  it("rejects registering a photo that was never uploaded", async () => {
    const res = await app.request("/api/photos", {
      method: "POST",
      headers: headers(aliceSession.accessToken),
      body: JSON.stringify({
        key: "photos/00000000-0000-4000-8000-000000000000.jpg",
        mimeType: "image/jpeg",
        size: 10,
      }),
    });
    expect(res.status).toBe(400);
  });

  it("lists photos newest first with uploader info", async () => {
    const res = await app.request("/api/photos", {
      headers: headers(aliceSession.accessToken),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: { id: string; uploadedBy: { name: string }; url: string }[];
      total: number;
    };
    expect(body.total).toBeGreaterThanOrEqual(1);
    const photo = body.items.find((p) => p.uploadedBy.name === "Photo Alice")!;
    expect(photo).toBeDefined();
    expect(photo.url).toContain("/api/uploads/photos/");
  });

  it("lets another member view a photo", async () => {
    const listRes = await app.request("/api/photos", {
      headers: headers(aliceSession.accessToken),
    });
    const body = (await listRes.json()) as { items: { id: string }[] };
    const photoId = body.items[0]!.id;

    const res = await app.request(`/api/photos/${photoId}`, {
      headers: headers(bobSession.accessToken),
    });
    expect(res.status).toBe(200);
  });

  it("only the uploader or an admin can delete", async () => {
    const { id } = await uploadPhoto(aliceSession);

    const denied = await app.request(`/api/photos/${id}`, {
      method: "DELETE",
      headers: headers(bobSession.accessToken),
    });
    expect(denied.status).toBe(403);

    const owned = await app.request(`/api/photos/${id}`, {
      method: "DELETE",
      headers: headers(aliceSession.accessToken),
    });
    expect(owned.status).toBe(200);

    const gone = await app.request(`/api/photos/${id}`, {
      headers: headers(aliceSession.accessToken),
    });
    expect(gone.status).toBe(404);
  });

  it("admins can delete anyone's photo", async () => {
    const { id } = await uploadPhoto(bobSession);
    const res = await app.request(`/api/photos/${id}`, {
      method: "DELETE",
      headers: headers(adminSession.accessToken),
    });
    expect(res.status).toBe(200);
  });
});
