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

interface AuditItem {
  id: string;
  actor: { id: string; name: string } | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditListBody {
  items: AuditItem[];
  total: number;
  page: number;
  pageSize: number;
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

async function signInAs(
  userId: string,
  password = "strong-password-123",
): Promise<Session> {
  const user = await User.findById(userId);
  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email: user!.email, password }),
  });
  if (res.status !== 200) throw new Error(`login failed: ${res.status}`);
  const body = (await res.json()) as { accessToken: string };
  return { accessToken: body.accessToken };
}

async function auditLogs(session: Session, query = ""): Promise<AuditListBody> {
  const res = await app.request(`/api/admin/audit-logs${query}`, {
    headers: headers(session.accessToken),
  });
  expect(res.status).toBe(200);
  return (await res.json()) as AuditListBody;
}

async function findLog(
  session: Session,
  action: string,
): Promise<AuditItem | undefined> {
  const body = await auditLogs(session, `?action=${action}`);
  return body.items.find((l) => l.action === action);
}

/** Request upload URL → PUT bytes → register — returns the object's id. */
async function uploadObject(
  session: Session,
  kind: "photo" | "document",
): Promise<string> {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  const mimeType = kind === "photo" ? "image/jpeg" : "application/pdf";
  const name = kind === "photo" ? undefined : "tax_records.pdf";

  const urlRes = await app.request(`/api/${kind}s/upload-url`, {
    method: "POST",
    headers: headers(session.accessToken),
    body: JSON.stringify({ name, mimeType, size: bytes.byteLength }),
  });
  expect(urlRes.status).toBe(200);
  const { uploadUrl, key } = (await urlRes.json()) as {
    uploadUrl: string;
    key: string;
  };

  const putRes = await app.request(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: bytes,
  });
  expect(putRes.status).toBe(200);

  const createRes = await app.request(`/api/${kind}s`, {
    method: "POST",
    headers: headers(session.accessToken),
    body: JSON.stringify(
      kind === "photo"
        ? { key, mimeType, size: bytes.byteLength, caption: "Audit test" }
        : {
            key,
            name,
            mimeType,
            size: bytes.byteLength,
            description: "Audit test",
          },
    ),
  });
  expect(createRes.status).toBe(200);
  const body = (await createRes.json()) as {
    photo: { id: string };
    document: { id: string };
  };
  return (body.photo ?? body.document).id;
}

let alice: Awaited<ReturnType<typeof createUser>>;
let admin: Awaited<ReturnType<typeof createUser>>;
let owner: Awaited<ReturnType<typeof createUser>>;
let aliceSession: Session;
let adminSession: Session;
let ownerSession: Session;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri("family-portal"));
  await primeCsrf();

  alice = await createUser("Audit Alice");
  admin = await createUser("Audit Admin", { role: "admin" });
  owner = await createUser("Audit Owner", { role: "owner" });
  aliceSession = await signInAs(alice._id.toString());
  adminSession = await signInAs(admin._id.toString());
  ownerSession = await signInAs(owner._id.toString());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("audit log access control", () => {
  it("rejects unauthenticated access", async () => {
    const res = await app.request("/api/admin/audit-logs");
    expect(res.status).toBe(401);
  });

  it("rejects non-admins", async () => {
    const res = await app.request("/api/admin/audit-logs", {
      headers: headers(aliceSession.accessToken),
    });
    expect(res.status).toBe(403);
  });

  it("lists logs for an admin", async () => {
    const body = await auditLogs(adminSession);
    expect(body.page).toBe(0);
    expect(body.pageSize).toBeGreaterThan(0);
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.items[0]!.createdAt).toBeTruthy();
  });
});

describe("audited actions", () => {
  it("records failed logins with the reason", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ email: alice.email, password: "wrong-password" }),
    });
    expect(res.status).toBe(401);

    const log = await findLog(adminSession, "LOGIN_FAILED");
    expect(log).toBeDefined();
    expect(log!.details).toMatchObject({ reason: "INVALID_CREDENTIALS" });
    expect(log!.actor).toBeNull();
  });

  it("records a password change to the member", async () => {
    const res = await app.request("/api/auth/change-password", {
      method: "POST",
      headers: headers(aliceSession.accessToken),
      body: JSON.stringify({
        currentPassword: "strong-password-123",
        newPassword: "stronger-password-456",
      }),
    });
    expect(res.status).toBe(200);

    const log = await findLog(adminSession, "PASSWORD_CHANGED");
    expect(log).toBeDefined();
    expect(log!.targetId).toBe(alice._id.toString());
  });

  it("records member approvals", async () => {
    const pending = await createUser("Audit Pending", {
      adminApprovalStatus: "pending",
    });

    const res = await app.request(
      `/api/admin/members/${pending._id.toString()}`,
      {
        method: "PATCH",
        headers: headers(adminSession.accessToken),
        body: JSON.stringify({ status: "approved" }),
      },
    );
    expect(res.status).toBe(200);

    const log = await findLog(adminSession, "MEMBER_APPROVED");
    expect(log).toBeDefined();
    expect(log!.details).toMatchObject({ member: pending.username });
    expect(log!.actor?.name).toBe("Audit Admin");
  });

  it("records role changes with before/after", async () => {
    const res = await app.request(
      `/api/admin/members/${alice._id.toString()}`,
      {
        method: "PATCH",
        headers: headers(ownerSession.accessToken),
        body: JSON.stringify({ status: "approved", role: "admin" }),
      },
    );
    expect(res.status).toBe(200);

    const log = await findLog(ownerSession, "ROLE_CHANGED");
    expect(log).toBeDefined();
    expect(log!.details).toMatchObject({ from: "adult", to: "admin" });
  });

  it("records photo deletion", async () => {
    // Earlier its rotate Alice's credentials (password change + promotion),
    // which correctly invalidate her original token — sign in again.
    aliceSession = await signInAs(
      alice._id.toString(),
      "stronger-password-456",
    );
    const photoId = await uploadObject(aliceSession, "photo");

    const res = await app.request(`/api/photos/${photoId}`, {
      method: "DELETE",
      headers: headers(aliceSession.accessToken),
    });
    expect(res.status).toBe(200);

    const log = await findLog(adminSession, "PHOTO_DELETED");
    expect(log).toBeDefined();
    expect(log!.targetId).toBe(photoId);
    expect(log!.details).toMatchObject({
      key: expect.stringContaining("photos/"),
    });
  });

  it("records document deletion", async () => {
    aliceSession = await signInAs(
      alice._id.toString(),
      "stronger-password-456",
    );
    const documentId = await uploadObject(aliceSession, "document");

    const res = await app.request(`/api/documents/${documentId}`, {
      method: "DELETE",
      headers: headers(aliceSession.accessToken),
    });
    expect(res.status).toBe(200);

    const log = await findLog(adminSession, "DOCUMENT_DELETED");
    expect(log).toBeDefined();
    expect(log!.targetId).toBe(documentId);
    expect(log!.details).toMatchObject({
      key: expect.stringContaining("documents/"),
    });
  });

  it("records when a share link is created", async () => {
    aliceSession = await signInAs(
      alice._id.toString(),
      "stronger-password-456",
    );
    const documentId = await uploadObject(aliceSession, "document");

    const res = await app.request(`/api/documents/${documentId}/share`, {
      method: "POST",
      headers: headers(aliceSession.accessToken),
    });
    expect(res.status).toBe(200);

    const log = await findLog(adminSession, "DOCUMENT_SHARED");
    expect(log).toBeDefined();
    expect(log!.details).toMatchObject({
      url: expect.stringContaining("/api/shared/documents/"),
    });
  });
});

describe("audit log filters", () => {
  it("filters by action and actor", async () => {
    const byAction = await auditLogs(adminSession, "?action=PASSWORD_CHANGED");
    expect(byAction.items.length).toBeGreaterThanOrEqual(1);
    expect(byAction.items.every((l) => l.action === "PASSWORD_CHANGED")).toBe(
      true,
    );

    const byActor = await auditLogs(
      adminSession,
      `?actorId=${alice._id.toString()}`,
    );
    expect(
      byActor.items.every((l) => l.actor?.id === alice._id.toString()),
    ).toBe(true);
  });

  it("paginates", async () => {
    const body = await auditLogs(adminSession, "?page=0&pageSize=5");
    expect(body.page).toBe(0);
    expect(body.pageSize).toBe(5);
    expect(body.items.length).toBeLessThanOrEqual(5);
  });
});
