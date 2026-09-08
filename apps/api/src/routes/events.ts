import type { Event as EventPayload } from "@family/core";
import {
  can,
  createEventRequestSchema,
  eventListSchema,
  updateEventRequestSchema,
} from "@family/core";
import { Hono } from "hono";
import { clientInfo, recordAudit } from "../lib/audit.js";
import { broadcastToApprovedMembers } from "../lib/notifications.js";
import { parseObjectIdParam, validateBody } from "../lib/validation.js";
import { AppError } from "../middleware/error.js";
import {
  originCheck,
  requireApprovedAuth,
  requireCapability,
} from "../middleware/security.js";
import { Event } from "../models/event.js";
import { User } from "../models/user.js";

export const eventsRoutes = new Hono();

eventsRoutes.use("*", originCheck, requireApprovedAuth);

/** Events within an optional [from, to] range, earliest first. */
eventsRoutes.get("/", async (c) => {
  const parsed = eventListSchema.safeParse(c.req.query());
  const { from, to } = parsed.success
    ? parsed.data
    : { from: undefined, to: undefined };

  const filter: Record<string, unknown> = {};
  if (from || to) {
    filter.startsAt = {};
    if (from) (filter.startsAt as Record<string, unknown>).$gte = from;
    if (to) (filter.startsAt as Record<string, unknown>).$lte = to;
  }

  const [events, total] = await Promise.all([
    Event.find(filter)
      .sort({ startsAt: 1 })
      .limit(500)
      .populate("createdBy", "name username")
      .lean(),
    Event.countDocuments(filter),
  ]);

  return c.json({
    items: (events as unknown as PopulatedEvent[]).map(toEventPayload),
    total,
  });
});

eventsRoutes.get("/:id", async (c) => {
  return c.json({
    event: toEventPayload(await findPopulatedEvent(parseObjectIdParam(c))),
  });
});

eventsRoutes.post(
  "/",
  requireCapability("createEvents"),
  validateBody(createEventRequestSchema),
  async (c) => {
    const userId = c.get("userId");
    const { title, type, startsAt, endsAt, description, recurrence } =
      c.req.valid("json");

    const event = await Event.create({
      title,
      type,
      startsAt,
      endsAt,
      description: description ?? undefined,
      recurrence,
      createdBy: userId,
    });

    const author = await User.findById(userId, "name");
    void broadcastToApprovedMembers(userId, {
      type: "event",
      actorId: userId,
      actorName: author?.name ?? "",
      body: title,
      link: "/events",
    });

    await recordAudit({
      actorId: userId,
      action: "EVENT_CREATED",
      targetType: "event",
      targetId: event._id.toString(),
      details: { title },
      ...clientInfo(c),
    });

    return c.json({
      event: toEventPayload(await findPopulatedEvent(event._id.toString())),
    });
  },
);

eventsRoutes.patch(
  "/:id",
  validateBody(updateEventRequestSchema),
  async (c) => {
    const userId = c.get("userId");
    const input = c.req.valid("json");

    const event = await Event.findById(parseObjectIdParam(c));
    if (!event) throw new AppError(404, "NOT_FOUND", "Event not found");

    await assertCanManage(event, userId);

    if (input.title !== undefined) event.title = input.title;
    if (input.type !== undefined) event.type = input.type;
    if (input.startsAt !== undefined) event.startsAt = input.startsAt;
    if (input.endsAt !== undefined) event.endsAt = input.endsAt;
    if (input.description !== undefined) event.description = input.description;
    if (input.recurrence !== undefined) event.recurrence = input.recurrence;

    await event.save();

    await recordAudit({
      actorId: userId,
      action: "EVENT_UPDATED",
      targetType: "event",
      targetId: event._id.toString(),
      details: { title: event.title },
      ...clientInfo(c),
    });

    return c.json({
      event: toEventPayload(await findPopulatedEvent(event._id.toString())),
    });
  },
);

eventsRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");

  const event = await Event.findById(parseObjectIdParam(c));
  if (!event) throw new AppError(404, "NOT_FOUND", "Event not found");

  await assertCanManage(event, userId);
  await event.deleteOne();

  await recordAudit({
    actorId: userId,
    action: "EVENT_DELETED",
    targetType: "event",
    targetId: event._id.toString(),
    details: { title: event.title },
    ...clientInfo(c),
  });

  return c.json({ ok: true });
});

async function assertCanManage(
  event: { createdBy: { toString(): string } },
  userId: string,
): Promise<void> {
  const user = await User.findById(userId, { role: 1 });
  const isOwner = event.createdBy.toString() === userId;
  if (!isOwner && !can(user?.role ?? "guest", "moderate")) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "Only the creator or a moderator can change events",
    );
  }
}

export interface PopulatedEvent {
  _id: { toString(): string };
  title: string;
  type: string;
  startsAt: Date;
  endsAt?: Date;
  description?: string;
  recurrence: "none" | "yearly";
  createdBy: { _id: { toString(): string }; name: string; username: string };
  createdAt: Date;
}

export function toEventPayload(event: PopulatedEvent): EventPayload {
  return {
    id: event._id.toString(),
    title: event.title,
    type: event.type as EventPayload["type"],
    startsAt: event.startsAt,
    endsAt: event.endsAt ?? null,
    description: event.description ?? null,
    recurrence: event.recurrence,
    createdBy: {
      id: event.createdBy._id.toString(),
      name: event.createdBy.name,
      username: event.createdBy.username,
    },
    createdAt: event.createdAt,
  };
}

async function findPopulatedEvent(eventId: string): Promise<PopulatedEvent> {
  const event = (await Event.findById(eventId)
    .populate("createdBy", "name username")
    .lean()) as unknown as PopulatedEvent | null;

  if (!event) throw new AppError(404, "NOT_FOUND", "Event not found");
  return event;
}
