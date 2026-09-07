import { nlRequestSchema, searchRequestSchema } from "@family/core";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  parseNlQuery,
  resolveBirthday,
  type NlMemberBirthday,
} from "../lib/nl-search.js";
import { toPublicMember } from "../lib/payloads.js";
import {
  originCheck,
  rateLimit,
  requireApprovedAuth,
} from "../middleware/security.js";
import { KulayaDocument } from "../models/document.js";
import { Event } from "../models/event.js";
import { ChatMessage } from "../models/message.js";
import { Photo } from "../models/photo.js";
import { Post } from "../models/post.js";
import { User } from "../models/user.js";
import { toMessagePayload, type PopulatedMessage } from "./chat.js";
import { toDocumentPayload, type PopulatedDocument } from "./documents.js";
import { toEventPayload, type PopulatedEvent } from "./events.js";
import { toPhotoPayload, type PopulatedPhoto } from "./photos.js";
import { toPostPayload, type PopulatedPost } from "./posts.js";

export const searchRoutes = new Hono();

searchRoutes.use("*", originCheck, requireApprovedAuth);

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

/**
 * Natural-language ("AI") search. Queries are parsed locally by the
 * rule-based parser in lib/nl-search.ts; family data never leaves the
 * server. Returns a direct answer when one applies (e.g. a birthday) plus
 * the routed results to browse.
 */
searchRoutes.get(
  "/nl",
  rateLimit({ windowMs: 60_000, max: 60, name: "search-nl" }),
  zValidator("query", nlRequestSchema),
  async (c) => {
    const { q } = c.req.valid("query");

    const members = await User.find({ adminApprovalStatus: "approved" })
      .select("name username dateOfBirth gender relationship role parentIds")
      .lean();

    const personMembers: NlMemberBirthday[] = members.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      dateOfBirth: user.dateOfBirth,
    }));

    const parsed = parseNlQuery(q, personMembers);

    const personDoc =
      parsed.personId !== undefined
        ? members.find((m) => m._id.toString() === parsed.personId)
        : undefined;

    const rx = parsed.keywords
      ? { $regex: escapeRegex(parsed.keywords), $options: "i" }
      : undefined;

    let people: ReturnType<typeof toPublicMember>[] = [];
    let photos: Awaited<ReturnType<typeof toPhotoPayload>>[] = [];
    let events: Awaited<ReturnType<typeof toEventPayload>>[] = [];
    let documents: Awaited<ReturnType<typeof toDocumentPayload>>[] = [];

    switch (parsed.intent) {
      case "birthday": {
        const answer = resolveBirthday(personMembers, parsed.personId);
        const resolved = members.find(
          (m) => m._id.toString() === answer.member.id,
        );
        people = resolved ? [toPublicMember(resolved as never)] : [];
        return c.json({
          query: q,
          intent: "birthday",
          filters: { dataset: "people" },
          answer,
          people,
          photos,
          events,
          documents,
        });
      }
      case "photos": {
        const query: Record<string, unknown> = {};
        if (rx) query.caption = rx;
        if (personDoc) query.uploadedBy = personDoc._id;
        const found = await Photo.find(query)
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("uploadedBy", "name username")
          .lean();
        photos = await Promise.all(
          (found as unknown as PopulatedPhoto[]).map(toPhotoPayload),
        );
        break;
      }
      case "documents": {
        const query: Record<string, unknown> = {};
        if (rx) query.$or = [{ name: rx }, { description: rx }];
        if (personDoc) query.uploadedBy = personDoc._id;
        const found = await KulayaDocument.find(query)
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("uploadedBy", "name username")
          .lean();
        documents = await Promise.all(
          (found as unknown as PopulatedDocument[]).map(toDocumentPayload),
        );
        break;
      }
      case "events": {
        const query: Record<string, unknown> = {};
        if (rx) query.$or = [{ title: rx }, { description: rx }];
        if (personDoc) query.createdBy = personDoc._id;
        const found = await Event.find(query)
          .sort({ startsAt: -1 })
          .limit(5)
          .populate("createdBy", "name username")
          .lean();
        events = (found as unknown as PopulatedEvent[]).map(toEventPayload);
        break;
      }
      default: {
        const filter: Record<string, unknown> = {
          adminApprovalStatus: "approved",
        };
        if (rx) filter.$or = [{ name: rx }, { username: rx }];
        people = (await User.find(filter).sort({ name: 1 }).limit(5)).map(
          (user) => toPublicMember(user as never),
        );

        const photoQuery: Record<string, unknown> = {};
        if (rx) photoQuery.caption = rx;
        if (personDoc) photoQuery.uploadedBy = personDoc._id;
        photos = await Promise.all(
          (
            (await Photo.find(photoQuery)
              .sort({ createdAt: -1 })
              .limit(5)
              .populate("uploadedBy", "name username")
              .lean()) as unknown as PopulatedPhoto[]
          ).map(toPhotoPayload),
        );

        const eventQuery: Record<string, unknown> = {};
        if (rx) eventQuery.$or = [{ title: rx }, { description: rx }];
        if (personDoc) eventQuery.createdBy = personDoc._id;
        events = (
          (await Event.find(eventQuery)
            .sort({ startsAt: -1 })
            .limit(5)
            .populate("createdBy", "name username")
            .lean()) as unknown as PopulatedEvent[]
        ).map(toEventPayload);

        const docQuery: Record<string, unknown> = {};
        if (rx) docQuery.$or = [{ name: rx }, { description: rx }];
        if (personDoc) docQuery.uploadedBy = personDoc._id;
        documents = await Promise.all(
          (
            (await KulayaDocument.find(docQuery)
              .sort({ createdAt: -1 })
              .limit(5)
              .populate("uploadedBy", "name username")
              .lean()) as unknown as PopulatedDocument[]
          ).map(toDocumentPayload),
        );
      }
    }

    return c.json({
      query: q,
      intent: parsed.intent,
      filters: {
        dataset: parsed.dataset,
        keywords: parsed.keywords,
        personName: parsed.personName,
        personId: parsed.personId,
      },
      answer: null,
      people,
      photos,
      events,
      documents,
    });
  },
);
