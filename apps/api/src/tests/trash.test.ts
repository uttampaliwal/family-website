import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { hashPassword } from "../lib/passwords.js";
import { KulayaDocument } from "../models/document.js";
import { Photo } from "../models/photo.js";
import { User } from "../models/user.js";

let mongo: MongoMemoryServer;
let csrfToken: string;
const cookies: Record<string, string> = {};

const app = createApp();

interface Session {
  accessToken: string;
}

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PDF = new TextEncoder().encode("%PDF-1.4 trash");

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

async function createUser(
  name: string,
  overrides: Record<string, unknown> = {},
) {
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
    body: JSON.stringify({
      email: user!.email,
      password: "strong-password-123",
    }),
  });
  if (res.status !== 200) throw new Error(`login failed: ${res.status}`);
  const body = (await res.json()) as { accessToken: string };
  return { accessToken: body.accessToken };
}

async function uploadPhoto(session: Session): Promise<string> {
  const urlRes = await app.request("/api/photos/upload-url", {
    method: "POST",
    headers: headers(session.accessToken),
    body: JSON.stringify({ mimeType: "image/jpeg", size: JPEG.byteLength }),
  });
  expect(urlRes.status).toBe(200);
  const { uploadUrl, key } = (await urlRes.json()) as {
    uploadUrl: string;
    key: string;
  };
  const putRes = await app.request(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "image/jpeg" },
    body: JPEG,
  });
  expect(putRes.status).toBe(200);
  const createRes = await app.request("/api/photos", {
    method: "POST",
    headers: headers(session.accessToken),
    body: JSON.stringify({
      key,
      mimeType: "image/jpeg",
      size: JPEG.byteLength,
    }),
  });
  expect(createRes.status).toBe(200);
  return ((await createRes.json()) as { photo: { id: string } }).photo.id;
}

async function uploadDocument(session: Session): Promise<string> {
  const urlRes = await app.request("/api/documents/upload-url", {
    method: "POST",
    headers: headers(session.accessToken),
    body: JSON.stringify({
      name: "trash.pdf",
      mimeType: "application/pdf",
      size: PDF.byteLength,
    }),
  });
  expect(urlRes.status).toBe(200);
  const { uploadUrl, key } = (await urlRes.json()) as {
    uploadUrl: string;
    key: string;
  };
  const putRes = await app.request(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/pdf" },
    body: PDF,
  });
  expect(putRes.status).toBe(200);
  const createRes = await app.request("/api/documents", {
    method: "POST",
    headers: headers(session.accessToken),
    body: JSON.stringify({
      key,
      name: "trash.pdf",
      mimeType: "application/pdf",
      size: PDF.byteLength,
    }),
  });
  expect(createRes.status).toBe(200);
  return ((await createRes.json()) as { document: { id: string } }).document.id;
}

let alice: Awaited<ReturnType<typeof createUser>>;
let admin: Awaited<ReturnType<typeof createUser>>;
let aliceSession: Session;
let adminSession: Session;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri("family-portal"));
  await primeCsrf();

  alice = await createUser("Trash Alice");
  admin = await createUser("Trash Admin", { role: "admin" });
  aliceSession = await signInAs(alice._id.toString());
  adminSession = await signInAs(admin._id.toString());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("photo trash", () => {
  it("soft-deletes, hides, restores, then permanently purges", async () => {
    const id = await uploadPhoto(aliceSession);

    const trashed = await app.request(`/api/photos/${id}`, {
      method: "DELETE",
      headers: headers(aliceSession.accessToken),
    });
    expect(trashed.status).toBe(200);
    expect(((await trashed.json()) as { trashed: boolean }).trashed).toBe(true);

    // Hidden from normal reads, visible in Trash, bytes retained.
    expect(
      (
        await app.request(`/api/photos/${id}`, {
          headers: headers(aliceSession.accessToken),
        })
      ).status,
    ).toBe(404);
    const trash = (await (
      await app.request("/api/photos/trash", {
        headers: headers(aliceSession.accessToken),
      })
    ).json()) as { items: { id: string }[] };
    expect(trash.items.map((p) => p.id)).toContain(id);
    expect(await Photo.findById(id)).not.toBeNull();

    const restored = await app.request(`/api/photos/${id}/restore`, {
      method: "POST",
      headers: headers(aliceSession.accessToken),
    });
    expect(restored.status).toBe(200);
    expect(
      (
        await app.request(`/api/photos/${id}`, {
          headers: headers(aliceSession.accessToken),
        })
      ).status,
    ).toBe(200);

    // Permanent deletion is moderator-only and removes bytes + metadata.
    const forbidden = await app.request(`/api/photos/${id}/permanent`, {
      method: "DELETE",
      headers: headers(aliceSession.accessToken),
    });
    expect(forbidden.status).toBe(403);

    const purged = await app.request(`/api/photos/${id}/permanent`, {
      method: "DELETE",
      headers: headers(adminSession.accessToken),
    });
    expect(purged.status).toBe(200);
    expect(await Photo.findById(id)).toBeNull();
  });
});

describe("document trash", () => {
  it("blocks download/share while trashed and restores cleanly", async () => {
    const id = await uploadDocument(aliceSession);

    expect(
      (
        await app.request(`/api/documents/${id}`, {
          method: "DELETE",
          headers: headers(aliceSession.accessToken),
        })
      ).status,
    ).toBe(200);

    expect(
      (
        await app.request(`/api/documents/${id}/download`, {
          headers: headers(aliceSession.accessToken),
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await app.request(`/api/documents/${id}/share`, {
          method: "POST",
          headers: headers(aliceSession.accessToken),
        })
      ).status,
    ).toBe(404);

    const trash = (await (
      await app.request("/api/documents/trash", {
        headers: headers(aliceSession.accessToken),
      })
    ).json()) as { items: { id: string }[] };
    expect(trash.items.map((d) => d.id)).toContain(id);

    expect(
      (
        await app.request(`/api/documents/${id}/restore`, {
          method: "POST",
          headers: headers(aliceSession.accessToken),
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await app.request(`/api/documents/${id}/download`, {
          headers: headers(aliceSession.accessToken),
        })
      ).status,
    ).toBe(200);
  });

  it("purges only trash older than retention", async () => {
    const id = await uploadDocument(aliceSession);
    await app.request(`/api/documents/${id}`, {
      method: "DELETE",
      headers: headers(aliceSession.accessToken),
    });

    // Fresh trash survives the purge.
    const before = await app.request("/api/documents/trash/purge", {
      method: "POST",
      headers: headers(adminSession.accessToken),
    });
    expect(before.status).toBe(200);
    expect(((await before.json()) as { purged: number }).purged).toBe(0);

    // Backdate past retention → purged with bytes removed.
    const doc = await KulayaDocument.findById(id);
    const key = doc!.key;
    await KulayaDocument.updateOne(
      { _id: id },
      { $set: { deletedAt: new Date(Date.now() - 31 * 86400_000) } },
    );
    const after = await app.request("/api/documents/trash/purge", {
      method: "POST",
      headers: headers(adminSession.accessToken),
    });
    expect(((await after.json()) as { purged: number }).purged).toBe(1);
    expect(await KulayaDocument.findById(id)).toBeNull();

    const { storage } = await import("../lib/storage.js");
    expect(await storage.headObject(key)).toBeNull();
  });
});
