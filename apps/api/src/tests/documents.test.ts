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

interface DocumentBody {
  document: {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    shareUrl: string | null;
    uploadedBy: { name: string };
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

/** Full happy path: request URL → PUT bytes → register → returns document. */
async function uploadDocument(
  session: Session,
  name = "winter_menu.pdf",
  bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]),
  mimeType = "application/pdf",
): Promise<{ id: string; name: string }> {
  const urlRes = await app.request("/api/documents/upload-url", {
    method: "POST",
    headers: headers(session.accessToken),
    body: JSON.stringify({ name, mimeType, size: bytes.byteLength }),
  });
  expect(urlRes.status).toBe(200);
  const { uploadUrl, key } = (await urlRes.json()) as { uploadUrl: string; key: string };

  const putRes = await app.request(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: bytes,
  });
  expect(putRes.status).toBe(200);

  const createRes = await app.request("/api/documents", {
    method: "POST",
    headers: headers(session.accessToken),
    body: JSON.stringify({ key, name, mimeType, size: bytes.byteLength, description: "Test doc" }),
  });
  expect(createRes.status).toBe(200);
  const body = (await createRes.json()) as DocumentBody;
  return { id: body.document.id, name: body.document.name };
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

  alice = await createUser("Doc Alice");
  bob = await createUser("Doc Bob", { gender: "female" });
  admin = await createUser("Doc Admin", { role: "admin" });
  aliceSession = await signInAs(alice._id.toString());
  bobSession = await signInAs(bob._id.toString());
  adminSession = await signInAs(admin._id.toString());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("documents routes", () => {
  it("requires a bearer token", async () => {
    const res = await app.request("/api/documents", { headers: headers() });
    expect(res.status).toBe(401);
  });

  it("re-checks approval status on document routes", async () => {
    const pending = await createUser("Degraded Archivist");
    const session = await signInAs(pending._id.toString());

    await User.findByIdAndUpdate(pending._id, { adminApprovalStatus: "pending" });

    const res = await app.request("/api/documents", { headers: headers(session.accessToken) });
    expect(res.status).toBe(403);
  });

  it("rejects oversized uploads", async () => {
    const res = await app.request("/api/documents/upload-url", {
      method: "POST",
      headers: headers(aliceSession.accessToken),
      body: JSON.stringify({ name: "huge.zip", mimeType: "application/pdf", size: 26 * 1024 * 1024 }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects unsupported mime types", async () => {
    const res = await app.request("/api/documents/upload-url", {
      method: "POST",
      headers: headers(aliceSession.accessToken),
      body: JSON.stringify({ name: "evil.html", mimeType: "text/html", size: 100 }),
    });
    expect(res.status).toBe(400);
  });

  it("registers a document after the direct upload", async () => {
    const { id } = await uploadDocument(aliceSession);
    const res = await app.request(`/api/documents/${id}`, {
      headers: headers(aliceSession.accessToken),
    });
    const body = (await res.json()) as DocumentBody;
    expect(body.document.shareUrl).toBeNull();
  });

  it("rejects registering a document that was never uploaded", async () => {
    const res = await app.request("/api/documents", {
      method: "POST",
      headers: headers(aliceSession.accessToken),
      body: JSON.stringify({
        key: "documents/00000000-0000-4000-8000-000000000000.pdf",
        name: "ghost.pdf",
        mimeType: "application/pdf",
        size: 10,
      }),
    });
    expect(res.status).toBe(400);
  });

  it("sanitizes path separators out of file names", async () => {
    const { name } = await uploadDocument(aliceSession, "../../../etc/passwd.pdf");
    expect(name).toBe("passwd.pdf");
  });

  it("lists documents newest first with uploader info", async () => {
    const res = await app.request("/api/documents", {
      headers: headers(aliceSession.accessToken),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: { id: string; name: string; uploadedBy: { name: string } }[];
      total: number;
    };
    expect(body.total).toBeGreaterThanOrEqual(2);
    const doc = body.items.find((d) => d.uploadedBy.name === "Doc Alice")!;
    expect(doc).toBeDefined();
  });

  it("lets another member view a document", async () => {
    const listRes = await app.request("/api/documents", {
      headers: headers(aliceSession.accessToken),
    });
    const body = (await listRes.json()) as { items: { id: string }[] };
    const docId = body.items[0]!.id;

    const res = await app.request(`/api/documents/${docId}`, {
      headers: headers(bobSession.accessToken),
    });
    expect(res.status).toBe(200);
  });

  it("serves a download redirect", async () => {
    const { id } = await uploadDocument(bobSession, "notes.txt", new TextEncoder().encode("family notes"), "text/plain");
    const res = await app.request(`/api/documents/${id}/download`, {
      headers: headers(aliceSession.accessToken),
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/api/uploads/documents/");
  });

  it("only the uploader or an admin can delete", async () => {
    const { id } = await uploadDocument(aliceSession);

    const denied = await app.request(`/api/documents/${id}`, {
      method: "DELETE",
      headers: headers(bobSession.accessToken),
    });
    expect(denied.status).toBe(403);

    const owned = await app.request(`/api/documents/${id}`, {
      method: "DELETE",
      headers: headers(aliceSession.accessToken),
    });
    expect(owned.status).toBe(200);

    const gone = await app.request(`/api/documents/${id}`, {
      headers: headers(aliceSession.accessToken),
    });
    expect(gone.status).toBe(404);
  });

  it("admins can delete anyone's document", async () => {
    const { id } = await uploadDocument(bobSession);
    const res = await app.request(`/api/documents/${id}`, {
      method: "DELETE",
      headers: headers(adminSession.accessToken),
    });
    expect(res.status).toBe(200);
  });

  it("creates a public share link the owner can revoke", async () => {
    const { id } = await uploadDocument(aliceSession);

    const share = await app.request(`/api/documents/${id}/share`, {
      method: "POST",
      headers: headers(aliceSession.accessToken),
    });
    expect(share.status).toBe(200);
    const { url } = (await share.json()) as { url: string };
    expect(url).toMatch(/^\/api\/shared\/documents\/[A-Za-z0-9_-]+$/);

    const anon = await app.request(url);
    expect(anon.status).toBe(302);
    expect(anon.headers.get("location")).toContain("/api/uploads/documents/");

    const revoke = await app.request(`/api/documents/${id}/share`, {
      method: "DELETE",
      headers: headers(aliceSession.accessToken),
    });
    expect(revoke.status).toBe(200);

    const gone = await app.request(url);
    expect(gone.status).toBe(404);
  });

  it("only the uploader or an admin can manage the share link", async () => {
    const { id } = await uploadDocument(aliceSession);

    const res = await app.request(`/api/documents/${id}/share`, {
      method: "POST",
      headers: headers(bobSession.accessToken),
    });
    expect(res.status).toBe(403);
  });
});