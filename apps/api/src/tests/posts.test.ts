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

interface PostBody {
  post: {
    id: string;
    body: string;
    likeCount: number;
    likedByMe: boolean;
    comments: { id: string; body: string; createdBy: { name: string } }[];
    createdBy: { name: string };
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

async function createPost(session: Session, body: unknown) {
  return app.request("/api/posts", {
    method: "POST",
    headers: headers(session.accessToken),
    body: JSON.stringify(body),
  });
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

  alice = await createUser("Mom Alice");
  bob = await createUser("Cousin Bob", { gender: "female" });
  admin = await createUser("Admin Uncle", { role: "admin" });
  aliceSession = await signInAs(alice._id.toString());
  bobSession = await signInAs(bob._id.toString());
  adminSession = await signInAs(admin._id.toString());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("posts routes", () => {
  it("requires a bearer token", async () => {
    const res = await app.request("/api/posts", { headers: headers() });
    expect(res.status).toBe(401);
  });

  it("re-checks approval status on post routes", async () => {
    const pending = await createUser("Degraded Storyteller");
    const session = await signInAs(pending._id.toString());

    await User.findByIdAndUpdate(pending._id, { adminApprovalStatus: "pending" });

    const res = await app.request("/api/posts", { headers: headers(session.accessToken) });
    expect(res.status).toBe(403);
  });

  it("creates a post", async () => {
    const res = await createPost(aliceSession, { body: "Sunday lunch at the grand table!" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as PostBody;
    expect(body.post.body).toBe("Sunday lunch at the grand table!");
    expect(body.post.createdBy.name).toBe("Mom Alice");
    expect(body.post.likeCount).toBe(0);
    expect(body.post.likedByMe).toBe(false);
    expect(body.post.comments).toEqual([]);
  });

  it("validates the post body", async () => {
    expect((await createPost(aliceSession, { body: "   " })).status).toBe(422);
    expect((await createPost(aliceSession, {})).status).toBe(422);
    expect((await createPost(aliceSession, { body: "x".repeat(2001) })).status).toBe(422);
  });

  it("lists the feed newest first", async () => {
    const { post: createdPost } = (await (await createPost(bobSession, { body: "Happy new year all!" })).json()) as PostBody;
    const id = createdPost.id;

    const res = await app.request("/api/posts", { headers: headers(aliceSession.accessToken) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: PostBody["post"][]; total: number };
    expect(body.total).toBeGreaterThanOrEqual(2);
    expect(body.items[0]!.id).toBe(id);
    expect(body.items[1]!.createdBy.name).toBe("Mom Alice");
  });

  it("fetches a single post", async () => {
    const list = await app.request("/api/posts", { headers: headers(aliceSession.accessToken) });
    const { items } = (await list.json()) as { items: PostBody["post"][] };

    const res = await app.request(`/api/posts/${items[0]!.id}`, {
      headers: headers(aliceSession.accessToken),
    });
    expect(res.status).toBe(200);

    const missing = await app.request(
      `/api/posts/${new mongoose.Types.ObjectId().toString()}`,
      { headers: headers(aliceSession.accessToken) },
    );
    expect(missing.status).toBe(404);
  });

  it("toggles likes", async () => {
    const { post } = (await (await createPost(aliceSession, { body: "likable moment" })).json()) as PostBody;
    const id = post.id;

    const like = await app.request(`/api/posts/${id}/like`, {
      method: "POST",
      headers: headers(bobSession.accessToken),
    });
    expect(like.status).toBe(200);
    expect(await like.json()).toEqual({ liked: true, likeCount: 1 });

    const feed = await app.request("/api/posts", { headers: headers(bobSession.accessToken) });
    const { items } = (await feed.json()) as { items: PostBody["post"][] };
    expect(items.find((p) => p.id === id)?.likedByMe).toBe(true);

    const unlike = await app.request(`/api/posts/${id}/like`, {
      method: "POST",
      headers: headers(bobSession.accessToken),
    });
    expect(await unlike.json()).toEqual({ liked: false, likeCount: 0 });
  });

  it("404s when liking a missing post", async () => {
    const res = await app.request(
      `/api/posts/${new mongoose.Types.ObjectId().toString()}/like`,
      { method: "POST", headers: headers(aliceSession.accessToken) },
    );
    expect(res.status).toBe(404);
  });

  it("only the author or an admin can delete a post", async () => {
    const { post } = (await (await createPost(aliceSession, { body: "delete me" })).json()) as PostBody;

    const denied = await app.request(`/api/posts/${post.id}`, {
      method: "DELETE",
      headers: headers(bobSession.accessToken),
    });
    expect(denied.status).toBe(403);

    const owned = await app.request(`/api/posts/${post.id}`, {
      method: "DELETE",
      headers: headers(aliceSession.accessToken),
    });
    expect(owned.status).toBe(200);

    const gone = await app.request(`/api/posts/${post.id}`, {
      headers: headers(aliceSession.accessToken),
    });
    expect(gone.status).toBe(404);
  });

  it("admins can delete anyone's post", async () => {
    const { post } = (await (await createPost(bobSession, { body: "admin removes" })).json()) as PostBody;
    const res = await app.request(`/api/posts/${post.id}`, {
      method: "DELETE",
      headers: headers(adminSession.accessToken),
    });
    expect(res.status).toBe(200);
  });

  it("adds a comment", async () => {
    const { post } = (await (await createPost(aliceSession, { body: "comment on me" })).json()) as PostBody;

    const signed = await app.request(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: headers(bobSession.accessToken),
      body: JSON.stringify({ body: "Sounds lovely!" }),
    });
    expect(signed.status).toBe(200);

    const res = await app.request(`/api/posts/${post.id}`, {
      headers: headers(aliceSession.accessToken),
    });
    const body = (await res.json()) as PostBody;
    expect(body.post.comments).toHaveLength(1);
    expect(body.post.comments[0]!.body).toBe("Sounds lovely!");
    expect(body.post.comments[0]!.createdBy.name).toBe("Cousin Bob");
  });

  it("validates comments and 404s on missing posts", async () => {
    const { post } = (await (await createPost(aliceSession, { body: "comments subject" })).json()) as PostBody;

    const blank = await app.request(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: headers(bobSession.accessToken),
      body: JSON.stringify({ body: "  " }),
    });
    expect(blank.status).toBe(422);

    const missing = await app.request(
      `/api/posts/${new mongoose.Types.ObjectId().toString()}/comments`,
      { method: "POST", headers: headers(bobSession.accessToken), body: JSON.stringify({ body: "hi" }) },
    );
    expect(missing.status).toBe(404);
  });

  it("only the comment author or an admin can delete a comment", async () => {
    const { post } = (await (await createPost(aliceSession, { body: "with a comment" })).json()) as PostBody;
    await app.request(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: headers(bobSession.accessToken),
      body: JSON.stringify({ body: "mine to remove" }),
    });

    const feed = await app.request(`/api/posts/${post.id}`, { headers: headers(aliceSession.accessToken) });
    const { post: withComment } = (await feed.json()) as PostBody;
    const commentId = withComment.comments[0]!.id;

    const denied = await app.request(`/api/posts/${post.id}/comments/${commentId}`, {
      method: "DELETE",
      headers: headers(aliceSession.accessToken),
    });
    expect(denied.status).toBe(403);

    const removed = await app.request(`/api/posts/${post.id}/comments/${commentId}`, {
      method: "DELETE",
      headers: headers(bobSession.accessToken),
    });
    expect(removed.status).toBe(200);

    const again = await app.request(`/api/posts/${post.id}/comments/${commentId}`, {
      method: "DELETE",
      headers: headers(bobSession.accessToken),
    });
    expect(again.status).toBe(404);
  });
});