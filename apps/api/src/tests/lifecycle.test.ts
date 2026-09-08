import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { hashPassword } from "../lib/passwords.js";
import { KulayaDocument } from "../models/document.js";
import { Event } from "../models/event.js";
import { Photo } from "../models/photo.js";
import { Post } from "../models/post.js";
import { User } from "../models/user.js";

let mongo: MongoMemoryServer;
let csrfToken: string;
const cookies: Record<string, string> = {};

const app = createApp();
const PASSWORD = "strong-password-123";

async function primeCsrf() {
  const res = await app.request("/api/auth/csrf-token");
  const setCookie = res.headers.getSetCookie()[0] ?? "";
  const match = /kulaya_csrf=([^;]+)/.exec(setCookie);
  csrfToken = match ? decodeURIComponent(match[1]!) : "";
  cookies.kulaya_csrf = csrfToken;
}

function headers(token?: string, ip = "10.7.0.1") {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Forwarded-For": ip,
    Cookie: Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; "),
  };
  if (csrfToken) h["X-CSRF-Token"] = csrfToken;
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

let ipSeq = 10;
async function createUser(
  name: string,
  overrides: Record<string, unknown> = {},
) {
  ipSeq += 1;
  return User.create({
    name,
    email: `cycle${ipSeq}_${Date.now()}@example.com`,
    username: `cycle${ipSeq}_${Math.random().toString(36).slice(2, 9)}`,
    passwordHash: await hashPassword(PASSWORD),
    dateOfBirth: new Date("1990-05-20"),
    gender: "male",
    relationship: "son",
    isVerified: true,
    role: "adult",
    adminApprovalStatus: "approved",
    ...overrides,
  });
}

async function signIn(email: string): Promise<string> {
  ipSeq += 1;
  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: headers(undefined, `10.7.0.${ipSeq}`),
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  expect(res.status).toBe(200);
  return ((await res.json()) as { accessToken: string }).accessToken;
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri("family-portal"));
  await primeCsrf();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("personal export", () => {
  it("returns profile, content, media metadata, and a manifest", async () => {
    const member = await createUser("Export Eve");
    const token = await signIn(member.email);

    await Post.create({ body: "Eve's moment", createdBy: member._id });
    await Event.create({
      title: "Eve's birthday",
      type: "birthday",
      startsAt: new Date("2026-05-01"),
      recurrence: "yearly",
      createdBy: member._id,
    });
    await Photo.create({
      key: `photos/export-${Date.now()}.jpg`,
      mimeType: "image/jpeg",
      size: 10,
      sha256: "0".repeat(64),
      uploadedBy: member._id,
    });
    await KulayaDocument.create({
      key: `documents/export-${Date.now()}.pdf`,
      name: "export.pdf",
      mimeType: "application/pdf",
      size: 12,
      uploadedBy: member._id,
    });

    const res = await app.request("/api/members/me/export", {
      headers: headers(token),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      version: number;
      profile: { email: string };
      events: unknown[];
      moments: { posts: unknown[]; commentsOnOthersPosts: unknown[] };
      photos: { sha256: string | null; downloadUrl: string }[];
      documents: { downloadUrl: string }[];
      manifest: {
        counts: { posts: number; photos: number; documents: number };
      };
    };
    expect(body.version).toBe(1);
    expect(body.profile.email).toBe(member.email);
    expect(body.events).toHaveLength(1);
    expect(body.moments.posts).toHaveLength(1);
    expect(body.photos).toHaveLength(1);
    expect(body.photos[0]!.sha256).toBe("0".repeat(64));
    expect(body.photos[0]!.downloadUrl).toContain("/api/uploads/photos/");
    expect(body.documents).toHaveLength(1);
    expect(body.documents[0]!.downloadUrl).toContain("/api/uploads/documents/");
    expect(body.manifest.counts).toMatchObject({
      posts: 1,
      photos: 1,
      documents: 1,
    });
  });
});

describe("account scrub-delete", () => {
  it("wipes PII, kills sessions, keeps content", async () => {
    const owner = await createUser("Cycle Owner", { role: "owner" });
    const member = await createUser("Cycle Mallory");
    const ownerToken = await signIn(owner.email);
    const memberToken = await signIn(member.email);

    const post = await Post.create({
      body: "Mallory's post",
      createdBy: member._id,
    });

    const res = await app.request(
      `/api/admin/members/${member._id.toString()}`,
      {
        method: "DELETE",
        headers: headers(ownerToken),
      },
    );
    expect(res.status).toBe(200);

    // Old token dead (unverified + version-bumped → 403), password login dead.
    expect(
      (await app.request("/api/members", { headers: headers(memberToken) }))
        .status,
    ).toBe(403);
    const login = await app.request("/api/auth/login", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ email: member.email, password: PASSWORD }),
    });
    expect(login.status).toBe(401);

    // Content retained and still readable.
    const postRes = await app.request(`/api/posts/${post._id.toString()}`, {
      headers: headers(ownerToken),
    });
    expect(postRes.status).toBe(200);

    const scrubbed = await User.findById(member._id);
    expect(scrubbed!.name).toBe("Removed member");
    expect(scrubbed!.email).toContain("@invalid.local");
    expect(scrubbed!.adminApprovalStatus).toBe("rejected");
  });

  it("refuses self-delete and peer-tier delete", async () => {
    const admin = await createUser("Cycle Admin", { role: "admin" });
    const otherAdmin = await createUser("Cycle Admin2", { role: "admin" });
    const adminToken = await signIn(admin.email);

    expect(
      (
        await app.request(`/api/admin/members/${admin._id.toString()}`, {
          method: "DELETE",
          headers: headers(adminToken),
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await app.request(`/api/admin/members/${otherAdmin._id.toString()}`, {
          method: "DELETE",
          headers: headers(adminToken),
        })
      ).status,
    ).toBe(403);
  });
});
