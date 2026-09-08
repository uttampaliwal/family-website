import type { Notification as NotificationPayload } from "@family/core";
import { pageIndex, pageSize } from "@family/core";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import { logger } from "../lib/logger.js";
import { subscribeNotifications } from "../lib/sse.js";
import { parseObjectIdParam } from "../lib/validation.js";
import { AppError } from "../middleware/error.js";
import { originCheck, requireApprovedAuth } from "../middleware/security.js";
import { Notification } from "../models/notification.js";

export const notificationsRoutes = new Hono();

notificationsRoutes.use("*", originCheck, requireApprovedAuth);

interface LeanNotification {
  _id: { toString(): string };
  type: NotificationPayload["type"];
  actorId: { toString(): string } | null;
  actorName: string | null;
  body: string;
  link: string;
  readAt: Date | null;
  createdAt: Date;
}

function toNotificationPayload(n: LeanNotification): NotificationPayload {
  return {
    id: n._id.toString(),
    type: n.type,
    actor:
      n.actorId && n.actorName
        ? { id: n.actorId.toString(), name: n.actorName }
        : null,
    body: n.body,
    link: n.link,
    readAt: n.readAt,
    createdAt: n.createdAt,
  };
}

const listSchema = z.object({ page: pageIndex, pageSize });

/** The current user's notifications, newest first. */
notificationsRoutes.get("/", zValidator("query", listSchema), async (c) => {
  const userId = c.get("userId");
  const { page, pageSize: limit } = c.req.valid("query");

  const [items, total, unreadCount] = await Promise.all([
    Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ recipientId: userId }),
    Notification.countDocuments({ recipientId: userId, readAt: null }),
  ]);

  return c.json({
    items: (items as unknown as LeanNotification[]).map(toNotificationPayload),
    total,
    unreadCount,
  });
});

notificationsRoutes.get("/unread-count", async (c) => {
  const userId = c.get("userId");
  const count = await Notification.countDocuments({
    recipientId: userId,
    readAt: null,
  });
  return c.json({ count });
});

notificationsRoutes.post("/read-all", async (c) => {
  const userId = c.get("userId");
  const result = await Notification.updateMany(
    { recipientId: userId, readAt: null },
    { $set: { readAt: new Date() } },
  );
  return c.json({ ok: true, updated: result.modifiedCount });
});

notificationsRoutes.post("/:id/read", async (c) => {
  const userId = c.get("userId");

  const notification = await Notification.findById(parseObjectIdParam(c));
  if (!notification)
    throw new AppError(404, "NOT_FOUND", "Notification not found");
  if (notification.recipientId.toString() !== userId) {
    throw new AppError(403, "FORBIDDEN", "Not your notification");
  }

  if (!notification.readAt) {
    notification.readAt = new Date();
    await notification.save();
  }
  return c.json({ ok: true });
});

notificationsRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");

  const notification = await Notification.findById(parseObjectIdParam(c));
  if (!notification)
    throw new AppError(404, "NOT_FOUND", "Notification not found");
  if (notification.recipientId.toString() !== userId) {
    throw new AppError(403, "FORBIDDEN", "Not your notification");
  }

  await notification.deleteOne();
  return c.json({ ok: true });
});

// ─── Real-time stream ───────────────────────────────────────────────

notificationsRoutes.get("/stream", async (c) => {
  const userId = c.get("userId");
  logger.info({ userId }, "notification SSE connected");

  return streamSSE(c, async (stream) => {
    const unsubscribe = subscribeNotifications(userId, (payload) => {
      void stream.writeSSE({ data: payload });
    });

    const heartbeat = setInterval(() => {
      void stream.writeSSE({ data: JSON.stringify({ type: "ping" }) });
    }, 25_000);

    await new Promise<void>((resolve) => {
      stream.onAbort(() => resolve());
    });

    clearInterval(heartbeat);
    unsubscribe();
  });
});
