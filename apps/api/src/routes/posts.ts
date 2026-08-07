import { Hono } from "hono";
import type { Context, Next } from "hono";
import mongoose from "mongoose";
import type { Post as PostPayload } from "@family/core";
import {
  createCommentRequestSchema,
  createPostRequestSchema,
} from "@family/core";
import { AppError } from "../middleware/error.js";
import { originCheck, requireAuth } from "../middleware/security.js";
import { validateBody } from "../lib/validation.js";
import { createNotification } from "../lib/notifications.js";
import { Post } from "../models/post.js";
import { User } from "../models/user.js";

export const postsRoutes = new Hono();

async function requireApprovedMember(c: Context, next: Next) {
  const user = await User.findById(c.get("userId"), { adminApprovalStatus: 1 });
  if (!user || user.adminApprovalStatus !== "approved") {
    throw new AppError(403, "FORBIDDEN", "Your account must be approved first");
  }
  await next();
}

postsRoutes.use("*", originCheck, requireAuth, requireApprovedMember);

/** Feed, newest first. */
postsRoutes.get("/", async (c) => {
  const viewerId = c.get("userId");

  const posts = (await Post.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("createdBy", "name username")
    .populate("comments.createdBy", "name username")
    .lean()) as unknown as PopulatedPost[];

  const items = posts.map((post) => toPostPayload(post, viewerId));
  return c.json({ items, total: items.length });
});

postsRoutes.get("/:id", async (c) => {
  const post = await findPopulated(c.req.param("id"));
  return c.json({ post: toPostPayload(post, c.get("userId")) });
});

postsRoutes.post("/", validateBody(createPostRequestSchema), async (c) => {
  const userId = c.get("userId");
  const { body } = c.req.valid("json");

  const post = await Post.create({ body, createdBy: userId });
  const populated = await findPopulated(post._id.toString());
  return c.json({ post: toPostPayload(populated, userId) });
});

postsRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");

  const post = await Post.findById(c.req.param("id"));
  if (!post) throw new AppError(404, "NOT_FOUND", "Post not found");

  await assertCanManage(post.createdBy.toString(), userId, "post");

  await post.deleteOne();
  return c.json({ ok: true });
});

/** Toggle a like on the post. */
postsRoutes.post("/:id/like", async (c) => {
  const userId = c.get("userId");

  const post = await Post.findById(c.req.param("id"));
  if (!post) throw new AppError(404, "NOT_FOUND", "Post not found");

  const likedAt = post.likedBy.findIndex((id) => id.toString() === userId);
  let liked: boolean;
  if (likedAt >= 0) {
    post.likedBy.splice(likedAt, 1);
    liked = false;
  } else {
    post.likedBy.push(new mongoose.Types.ObjectId(userId));
    liked = true;
  }

  await post.save();

  if (liked && post.createdBy.toString() !== userId) {
    const liker = await User.findById(userId, "name");
    await createNotification({
      recipientId: post.createdBy.toString(),
      type: "moment_like",
      actorId: userId,
      actorName: liker?.name ?? "",
      link: "/moments",
    });
  }

  return c.json({ liked, likeCount: post.likedBy.length });
});

postsRoutes.post("/:id/comments", validateBody(createCommentRequestSchema), async (c) => {
  const userId = c.get("userId");
  const { body } = c.req.valid("json");

  const post = await Post.findById(c.req.param("id"));
  if (!post) throw new AppError(404, "NOT_FOUND", "Post not found");

  post.comments.push({
    body,
    createdBy: new mongoose.Types.ObjectId(userId),
  } as never);
  await post.save();

  if (post.createdBy.toString() !== userId) {
    const commenter = await User.findById(userId, "name");
    await createNotification({
      recipientId: post.createdBy.toString(),
      type: "moment_comment",
      actorId: userId,
      actorName: commenter?.name ?? "",
      body,
      link: "/moments",
    });
  }

  return c.json({ ok: true });
});

postsRoutes.delete("/:id/comments/:commentId", async (c) => {
  const userId = c.get("userId");

  const post = await Post.findById(c.req.param("id"));
  if (!post) throw new AppError(404, "NOT_FOUND", "Post not found");

  const comment = post.comments.id(c.req.param("commentId"));
  if (!comment) throw new AppError(404, "NOT_FOUND", "Comment not found");

  await assertCanManage(comment.createdBy.toString(), userId, "comment");

  comment.deleteOne();
  await post.save();

  return c.json({ ok: true });
});

async function assertCanManage(
  ownerId: string,
  userId: string,
  kind: "post" | "comment",
): Promise<void> {
  const user = await User.findById(userId, { role: 1 });
  const isOwner = ownerId === userId;
  if (!isOwner && user?.role !== "admin") {
    throw new AppError(403, "FORBIDDEN", `Only the author or an admin can delete this ${kind}`);
  }
}

export interface PopulatedPost {
  _id: unknown;
  body: string;
  createdBy: { _id: { toString(): string }; name: string; username: string };
  likedBy: { toString(): string }[];
  comments: {
    _id: unknown;
    body: string;
    createdBy: { _id: { toString(): string }; name: string; username: string };
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export function toPostPayload(post: PopulatedPost, viewerId: string): PostPayload {
  return {
    id: String(post._id),
    body: post.body,
    createdBy: {
      id: post.createdBy._id.toString(),
      name: post.createdBy.name,
      username: post.createdBy.username,
    },
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    likeCount: post.likedBy.length,
    likedByMe: post.likedBy.some((id) => id.toString() === viewerId),
    comments: post.comments.map((comment) => ({
      id: String(comment._id),
      body: comment.body,
      createdBy: {
        id: comment.createdBy._id.toString(),
        name: comment.createdBy.name,
        username: comment.createdBy.username,
      },
      createdAt: comment.createdAt,
    })),
  };
}

async function findPopulated(postId: string): Promise<PopulatedPost> {
  const post = (await Post.findById(postId)
    .populate("createdBy", "name username")
    .populate("comments.createdBy", "name username")
    .lean()) as unknown as PopulatedPost | null;

  if (!post) throw new AppError(404, "NOT_FOUND", "Post not found");
  return post;
}