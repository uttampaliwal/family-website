import { Hono } from "hono";
import type { Context, Next } from "hono";
import { zValidator } from "@hono/zod-validator";
import { searchRequestSchema } from "@family/core";
import { AppError } from "../middleware/error.js";
import { originCheck, rateLimit, requireAuth } from "../middleware/security.js";
import { toPublicMember } from "../lib/payloads.js";
import { User } from "../models/user.js";
import { Photo } from "../models/photo.js";
import { Post } from "../models/post.js";
import { Event } from "../models/event.js";
import { KulayaDocument } from "../models/document.js";
import { ChatMessage } from "../models/message.js";
import { toPhotoPayload, type PopulatedPhoto } from "./photos.js";
import { toPostPayload, type PopulatedPost } from "./posts.js";
import { toEventPayload, type PopulatedEvent } from "./events.js";
import { toDocumentPayload, type PopulatedDocument } from "./documents.js";
import { toMessagePayload, type PopulatedMessage } from "./chat.js";

export const searchRoutes = new Hono();

async function requireApprovedMember(c: Context, next: Next) {
  const user = await User.findById(c.get("userId"), { adminApprovalStatus: 1 });
  if (!user || user.adminApprovalStatus !== "approved") {
    throw new AppError(403, "FORBIDDEN", "Your account must be approved first");
  }
  await next();
}

searchRoutes.use("*", originCheck, requireAuth, requireApprovedMember);

/** Escape regex metacharacters so the query matches literally, not as a pattern. */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * One bar for the whole nest: people, photos, moments, events, documents
 * and chat messages, capped per group so the dropdown stays snappy.
 */
searchRoutes.get(
  "/",
  rateLimit({ windowMs: 60_000, max: 60, name: "search" }),
  zValidator("query", searchRequestSchema),
  async (c) => {
    const viewerId = c.get("userId");
    const { q, limit } = c.req.valid("query");

    const rx = { $regex: escapeRegex(q), $options: "i" };

    const [people, photos, posts, events, documents, messages] =
      await Promise.all([
        User.find({
          adminApprovalStatus: "approved",
          $or: [{ name: rx }, { username: rx }],
        })
          .sort({ name: 1 })
          .limit(limit)
          .lean(),
        Photo.find({ caption: rx })
          .sort({ createdAt: -1 })
          .limit(limit)
          .populate("uploadedBy", "name username")
          .lean(),
        Post.find({ body: rx })
          .sort({ createdAt: -1 })
          .limit(limit)
          .populate("createdBy", "name username")
          .populate("comments.createdBy", "name username")
          .lean(),
        Event.find({ $or: [{ title: rx }, { description: rx }] })
          .sort({ startsAt: -1 })
          .limit(limit)
          .populate("createdBy", "name username")
          .lean(),
        KulayaDocument.find({ $or: [{ name: rx }, { description: rx }] })
          .sort({ createdAt: -1 })
          .limit(limit)
          .populate("uploadedBy", "name username")
          .lean(),
        ChatMessage.find({ body: rx })
          .sort({ createdAt: -1 })
          .limit(limit)
          .populate("createdBy", "name username")
          .lean(),
      ]);

    return c.json({
      q,
      people: people.map((user) => toPublicMember(user as never)),
      photos: await Promise.all(
        (photos as unknown as PopulatedPhoto[]).map(toPhotoPayload),
      ),
      posts: (posts as unknown as PopulatedPost[]).map((post) =>
        toPostPayload(post, viewerId),
      ),
      events: (events as unknown as PopulatedEvent[]).map(toEventPayload),
      documents: await Promise.all(
        (documents as unknown as PopulatedDocument[]).map(toDocumentPayload),
      ),
      messages: (messages as unknown as PopulatedMessage[]).map(
        toMessagePayload,
      ),
    });
  },
);
