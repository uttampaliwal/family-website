import { z } from "zod";
import { name, objectId } from "./common.js";

export const postBodyMaxLength = 2000;

export const postAuthorSchema = z.object({
  id: objectId,
  name,
  username: z.string(),
});

const postBodySchema = z
  .string()
  .trim()
  .min(1, "Say something first")
  .max(postBodyMaxLength, `Moments can be at most ${postBodyMaxLength} characters`);

export const createPostRequestSchema = z.object({
  body: postBodySchema,
});

export const commentBodySchema = z
  .string()
  .trim()
  .min(1, "Write a comment first")
  .max(500, "Comments can be at most 500 characters");

export const createCommentRequestSchema = z.object({
  body: commentBodySchema,
});

export const commentSchema = z.object({
  id: objectId,
  body: z.string(),
  createdBy: postAuthorSchema,
  createdAt: z.coerce.date(),
});

export const postSchema = z.object({
  id: objectId,
  body: z.string(),
  createdBy: postAuthorSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  likeCount: z.number().int().nonnegative(),
  likedByMe: z.boolean(),
  comments: z.array(commentSchema),
});

export const postListResponseSchema = z.object({
  items: z.array(postSchema),
  total: z.number().int().nonnegative(),
});

export type CreatePostInput = z.infer<typeof createPostRequestSchema>;
export type CreateCommentInput = z.infer<typeof createCommentRequestSchema>;
export type Post = z.infer<typeof postSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type PostListResponse = z.infer<typeof postListResponseSchema>;