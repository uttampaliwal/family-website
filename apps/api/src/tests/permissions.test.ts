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

function get(path: string, session: Session) {
  return app.request(path, { headers: headers(session.accessToken) });
}

function post(path: string, session: Session, body: Record<string, unknown>) {
  return app.request(path, {
    method: "POST",
    headers: headers(session.accessToken),
    body: JSON.stringify(body),
  });
}

function patch(path: string, session: Session, body: Record<string, unknown>) {
  return app.request(path, {
    method: "PATCH",
    headers: headers(session.accessToken),
    body: JSON.stringify(body),
  });
}

function del(path: string, session: Session) {
  return app.request(path, { method: "DELETE", headers: headers(session.accessToken) });
}

describe("role permission matrix", () => {
  let guest: Session;
  let child: Session;
  let teen: Session;
  let adult: Session;
  let parent: Session;
  let admin: Session;
  let owner: Session;

  const readPaths = [
    "/api/members",
    "/api/members/tree",
    "/api/posts",
    "/api/events",
    "/api/documents",
    "/api/photos",
    "/api/announcements",
  ];

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri("family-portal"));
    await primeCsrf();

    guest = await signInAs(
      (await createUser("Guest Uncle", { role: "guest" }))._id.toString(),
    );
    child = await signInAs(
      (await createUser("Little Child", { role: "child" }))._id.toString(),
    );
    teen = await signInAs(
      (await createUser("Teen Niece", { role: "teen" }))._id.toString(),
    );
    adult = await signInAs(
      (await createUser("Adult Cousin", { role: "adult" }))._id.toString(),
    );
    parent = await signInAs(
      (await createUser("Parent Aunt", { role: "parent" }))._id.toString(),
    );
    admin = await signInAs(
      (await createUser("Admin Uncle", { role: "admin" }))._id.toString(),
    );
    owner = await signInAs(
      (await createUser("Owner Dada", { role: "owner" }))._id.toString(),
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  describe("guests are read-only", () => {
    it("can read every family dataset", async () => {
      for (const path of readPaths) {
        expect((await get(path, guest)).status, path).toBe(200);
      }
      const search = await get("/api/search?q=adult", guest);
      expect(search.status).toBe(200);
    });

    it("cannot use chat at all", async () => {
      expect((await get("/api/chat/rooms", guest)).status).toBe(403);
      expect(
        (await post("/api/chat/rooms", guest, { name: "Guest room" })).status,
      ).toBe(403);
      expect(
        (await post("/api/chat/rooms/000000000000000000000000/messages", guest, {
          body: "hi",
        })).status,
      ).toBe(403);
    });

    it("cannot create any content", async () => {
      expect(
        (await post("/api/posts", guest, { body: "hello" })).status,
      ).toBe(403);
      expect(
        (await post("/api/photos/upload-url", guest, {
          mimeType: "image/jpeg",
          size: 100,
        })).status,
      ).toBe(403);
      expect(
        (await post("/api/documents/upload-url", guest, {
          name: "family-record.pdf",
          mimeType: "application/pdf",
          size: 100,
        })).status,
      ).toBe(403);
      expect(
        (await post("/api/events", guest, {
          title: "Party",
          type: "gathering",
          startsAt: "2026-12-25T00:00:00.000Z",
          recurrence: "none",
        })).status,
      ).toBe(403);
      expect(
        (await patch("/api/admin/members/000000000000000000000000/relationships", guest, {
          parentIds: [],
        })).status,
      ).toBe(403);
    });
  });

  describe("children can chat but not publish", () => {
    it("can read rooms and send messages", async () => {
      expect((await get("/api/chat/rooms", child)).status).toBe(200);
    });

    it("cannot create rooms, moments, photos, events, or documents", async () => {
      expect(
        (await post("/api/chat/rooms", child, { name: "Kid room" })).status,
      ).toBe(403);
      expect((await post("/api/posts", child, { body: "hi" })).status).toBe(403);
      expect(
        (await post("/api/photos/upload-url", child, {
          mimeType: "image/jpeg",
          size: 100,
        })).status,
      ).toBe(403);
      expect(
        (await post("/api/events", child, {
          title: "Birthday",
          type: "celebration",
          startsAt: "2026-01-01T00:00:00.000Z",
          recurrence: "none",
        })).status,
      ).toBe(403);
      expect(
        (await post("/api/documents/upload-url", child, {
          name: "family-record.pdf",
          mimeType: "application/pdf",
          size: 100,
        })).status,
      ).toBe(403);
    });
  });

  describe("teens can share moments and photos", () => {
    it("can create moments and comment, and upload photos", async () => {
      expect((await post("/api/posts", teen, { body: "my day" })).status).toBe(200);
      const list = await get("/api/posts", teen);
      const postId = ((await list.json()) as { items: { id: string }[] }).items[0]!.id;
      expect((await post(`/api/posts/${postId}/comments`, teen, { body: "nice!" })).status).toBe(200);
      expect(
        (await post("/api/photos/upload-url", teen, {
          mimeType: "image/jpeg",
          size: 100,
        })).status,
      ).toBe(200);
    });

    it("cannot create events, documents, or chat rooms", async () => {
      expect(
        (await post("/api/events", teen, {
          title: "Party",
          type: "gathering",
          startsAt: "2026-06-01T00:00:00.000Z",
          recurrence: "none",
        })).status,
      ).toBe(403);
      expect(
        (await post("/api/documents/upload-url", teen, {
          name: "family-record.pdf",
          mimeType: "application/pdf",
          size: 100,
        })).status,
      ).toBe(403);
      expect(
        (await post("/api/chat/rooms", teen, { name: "Teen room" })).status,
      ).toBe(403);
    });
  });

  describe("adults organize events, documents, and rooms", () => {
    it("can create events, documents, and chat rooms", async () => {
      expect(
        (await post("/api/events", adult, {
          title: "Reunion",
          type: "gathering",
          startsAt: "2026-03-01T00:00:00.000Z",
          recurrence: "none",
        })).status,
      ).toBe(200);
      expect(
        (await post("/api/documents/upload-url", adult, {
          name: "family-record.pdf",
          mimeType: "application/pdf",
          size: 100,
        })).status,
      ).toBe(200);
      expect(
        (await post("/api/chat/rooms", adult, { name: "Adults room" })).status,
      ).toBe(200);
    });

    it("cannot moderate content or edit the tree", async () => {
      const list = await get("/api/posts", adult);
      const postId = ((await list.json()) as { items: { id: string }[] }).items[0]!.id;
      expect((await del(`/api/posts/${postId}`, adult)).status).toBe(403);
      expect(
        (await patch("/api/admin/members/000000000000000000000000/relationships", adult, {
          parentIds: [],
        })).status,
      ).toBe(403);
      expect((await get("/api/admin/members", adult)).status).toBe(403);
    });
  });

  describe("parents moderate and manage the tree", () => {
    it("can delete anyone's content", async () => {
      const list = await get("/api/posts", parent);
      const postId = ((await list.json()) as { items: { id: string }[] }).items[0]!.id;
      expect((await del(`/api/posts/${postId}`, parent)).status).toBe(200);
    });

    it("can edit family relationships", async () => {
      const childUser = await User.findOne({ name: "Little Child" });
      expect(
        (
          await patch(
            `/api/admin/members/${childUser!._id.toString()}/relationships`,
            parent,
            { parentIds: [] },
          )
        ).status,
      ).toBe(200);
    });

    it("cannot approve members or read audit logs", async () => {
      expect((await get("/api/admin/members", parent)).status).toBe(403);
      expect((await get("/api/admin/audit-logs", parent)).status).toBe(403);
    });
  });

  describe("admins manage members", () => {
    it("can approve members and default new approvals to child", async () => {
      const pending = await createUser("Pending Newbie", {
        adminApprovalStatus: "pending",
      });
      const res = await patch(`/api/admin/members/${pending._id.toString()}`, admin, {
        status: "approved",
      });
      expect(res.status).toBe(200);
      const reloaded = await User.findById(pending._id);
      expect(reloaded!.role).toBe("child");
    });

    it("can read audit logs", async () => {
      expect((await get("/api/admin/audit-logs", admin)).status).toBe(200);
    });

    it("cannot promote anyone to admin or touch owners", async () => {
      const childUser = await User.findOne({ name: "Little Child" });
      const promote = await patch(
        `/api/admin/members/${childUser!._id.toString()}`,
        admin,
        { status: "approved", role: "admin" },
      );
      expect(promote.status).toBe(403);
    });

    it("can assign roles strictly below their own", async () => {
      const childUser = await User.findOne({ name: "Little Child" });
      const res = await patch(
        `/api/admin/members/${childUser!._id.toString()}`,
        admin,
        { status: "approved", role: "parent" },
      );
      expect(res.status).toBe(200);
      const reloaded = await User.findById(childUser!._id);
      expect(reloaded!.role).toBe("parent");
    });

    it("cannot change another admin", async () => {
      const other = await createUser("Second Admin", { role: "admin" });
      const res = await patch(`/api/admin/members/${other._id.toString()}`, admin, {
        status: "approved",
        role: "adult",
      });
      expect(res.status).toBe(403);
    });
  });

  describe("the owner is unrestricted", () => {
    it("can promote members to admin", async () => {
      const teenUser = await User.findOne({ name: "Teen Niece" });
      const res = await patch(`/api/admin/members/${teenUser!._id.toString()}`, owner, {
        status: "approved",
        role: "admin",
      });
      expect(res.status).toBe(200);
      const reloaded = await User.findById(teenUser!._id);
      expect(reloaded!.role).toBe("admin");
    });
  });
});
