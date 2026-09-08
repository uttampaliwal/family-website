import { memberListSchema, updateProfileSchema } from "@family/core";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { toPublicMember } from "../lib/payloads.js";
import { storage } from "../lib/storage.js";
import { buildTree } from "../lib/tree.js";
import { parseObjectIdParam, validateBody } from "../lib/validation.js";
import { AppError } from "../middleware/error.js";
import { originCheck, requireApprovedAuth } from "../middleware/security.js";
import { KulayaDocument } from "../models/document.js";
import { Event } from "../models/event.js";
import { Photo } from "../models/photo.js";
import { Post } from "../models/post.js";
import { User } from "../models/user.js";

export const membersRoutes = new Hono();

membersRoutes.use("*", originCheck, requireApprovedAuth);

membersRoutes.get("/", zValidator("query", memberListSchema), async (c) => {
  const { page, pageSize, search } = c.req.valid("query");

  const filter: Record<string, unknown> = { adminApprovalStatus: "approved" };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { username: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ name: 1 })
      .skip(page * pageSize)
      .limit(pageSize)
      .exec(),
    User.countDocuments(filter),
  ]);

  return c.json({
    items: users.map(toPublicMember),
    total,
    page,
    pageSize,
  });
});

membersRoutes.patch("/me", validateBody(updateProfileSchema), async (c) => {
  const userId = c.get("userId");
  const input = c.req.valid("json");

  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "NOT_FOUND", "Account not found");

  if (input.name !== undefined) user.name = input.name;
  if (input.relationship !== undefined) user.relationship = input.relationship;
  if (input.phoneNumber !== undefined) {
    user.phoneNumber = input.phoneNumber?.trim()
      ? input.phoneNumber
      : undefined;
  }

  await user.save();
  return c.json({ member: toPublicMember(user) });
});

membersRoutes.get("/tree", async (c) => {
  return c.json(await buildTree());
});

/**
 * Personal data export (data portability). Application-level JSON — profile,
 * relations, authored content, and media metadata with short-lived download
 * URLs (re-request when expired) — not a raw database dump.
 */
membersRoutes.get("/me/export", async (c) => {
  const userId = c.get("userId");

  const user = await User.findById(userId).lean();
  if (!user) throw new AppError(404, "NOT_FOUND", "Account not found");

  const [events, posts, photos, documents] = await Promise.all([
    Event.find({ createdBy: userId }).sort({ startsAt: 1 }).lean(),
    Post.find({ createdBy: userId }).sort({ createdAt: -1 }).lean(),
    Photo.find({ uploadedBy: userId }).sort({ createdAt: -1 }).lean(),
    KulayaDocument.find({ uploadedBy: userId }).sort({ createdAt: -1 }).lean(),
  ]);

  const myComments = await Post.find(
    { "comments.createdBy": userId },
    { body: 0, likedBy: 0 },
  ).lean();

  const photosOut = await Promise.all(
    photos.map(async (p) => ({
      id: p._id.toString(),
      name: p.key.split("/").pop(),
      mimeType: p.mimeType,
      size: p.size,
      sha256: p.sha256 ?? null,
      caption: p.caption ?? null,
      createdAt: p.createdAt,
      downloadUrl: await storage.getObjectUrl(p.key),
    })),
  );
  const documentsOut = await Promise.all(
    documents.map(async (d) => ({
      id: d._id.toString(),
      name: d.name,
      mimeType: d.mimeType,
      size: d.size,
      sha256: d.sha256 ?? null,
      description: d.description ?? null,
      createdAt: d.createdAt,
      downloadUrl: await storage.getObjectUrl(d.key, { filename: d.name }),
    })),
  );

  return c.json({
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: {
      name: user.name,
      email: user.email,
      username: user.username,
      gender: user.gender,
      relationship: user.relationship,
      phoneNumber: user.phoneNumber ?? null,
      dateOfBirth: user.dateOfBirth,
      role: user.role,
      joinedAt: user.createdAt,
    },
    relations: {
      parentIds: (user.parentIds ?? []).map((id) => id.toString()),
    },
    events: events.map((e) => ({
      title: e.title,
      type: e.type,
      startsAt: e.startsAt,
      endsAt: e.endsAt ?? null,
      description: e.description ?? null,
      recurrence: e.recurrence,
      createdAt: e.createdAt,
    })),
    moments: {
      posts: posts.map((p) => ({
        id: p._id.toString(),
        body: p.body,
        likeCount: p.likedBy.length,
        createdAt: p.createdAt,
        comments: p.comments.map((cm) => ({
          id: cm._id.toString(),
          body: cm.body,
          byMe: cm.createdBy.toString() === userId,
          createdAt: cm.createdAt,
        })),
      })),
      commentsOnOthersPosts: myComments
        .filter((p) => p.createdBy.toString() !== userId)
        .map((p) => ({
          postId: p._id.toString(),
          comments: p.comments
            .filter((cm) => cm.createdBy.toString() === userId)
            .map((cm) => ({
              id: cm._id.toString(),
              body: cm.body,
              createdAt: cm.createdAt,
            })),
        })),
    },
    photos: photosOut,
    documents: documentsOut,
    manifest: {
      counts: {
        events: events.length,
        posts: posts.length,
        photos: photos.length,
        documents: documents.length,
      },
      note: "downloadUrl values are short-lived signed URLs — re-export when expired.",
    },
  });
});

membersRoutes.get("/:id", async (c) => {
  const user = await User.findOne({
    _id: parseObjectIdParam(c),
    adminApprovalStatus: "approved",
  });
  if (!user) throw new AppError(404, "NOT_FOUND", "Member not found");
  return c.json({ member: toPublicMember(user) });
});
