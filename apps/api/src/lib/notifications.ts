import type { Notification as NotificationPayload } from "@family/core";
import { Notification, type NotificationDocument } from "../models/notification.js";
import { User } from "../models/user.js";
import { publishNotificationEvent } from "./sse.js";
import { logger } from "./logger.js";

export type NotificationType = NotificationDocument["type"];

export interface CreateNotificationInput {
  recipientId: string;
  type: NotificationType;
  actorId?: string | null;
  actorName?: string | null;
  body?: string;
  link: string;
}

export interface NotificationBroadcastOptions {
  type: NotificationType;
  actorId?: string | null;
  actorName?: string | null;
  body?: string;
  link: string;
}

function toNotificationPayload(notification: NotificationDocument): NotificationPayload {
  return {
    id: notification._id.toString(),
    type: notification.type,
    actor:
      notification.actorId && notification.actorName
        ? { id: notification.actorId.toString(), name: notification.actorName }
        : null,
    body: notification.body,
    link: notification.link,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  };
}

/** Creates a notification for one recipient and pushes it over SSE. */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<NotificationDocument> {
  const notification = await Notification.create({
    recipientId: input.recipientId,
    type: input.type,
    actorId: input.actorId ?? null,
    actorName: input.actorName ?? null,
    body: input.body ?? "",
    link: input.link,
  });

  publishNotificationEvent(input.recipientId, {
    type: "notification",
    notification: toNotificationPayload(notification),
  });
  return notification;
}

/**
 * Notifies every approved member except the excluded user. Fire-and-forget:
 * failures are logged, never raised to the caller.
 */
export async function broadcastToApprovedMembers(
  excludeUserId: string,
  options: NotificationBroadcastOptions,
): Promise<void> {
  try {
    const recipients = await User.find(
      { adminApprovalStatus: "approved", _id: { $ne: excludeUserId } },
      { _id: 1 },
    ).lean();

    for (const recipient of recipients) {
      await createNotification({
        recipientId: recipient._id.toString(),
        ...options,
      });
    }
  } catch (err) {
    logger.error({ err }, "Failed to broadcast notifications to members");
  }
}

/** Notifies every approved admin. Fire-and-forget like the broadcast above. */
export async function notifyAdmins(options: NotificationBroadcastOptions): Promise<void> {
  try {
    const admins = await User.find(
      { role: "admin", adminApprovalStatus: "approved" },
      { _id: 1 },
    ).lean();

    for (const admin of admins) {
      await createNotification({
        recipientId: admin._id.toString(),
        ...options,
      });
    }
  } catch (err) {
    logger.error({ err }, "Failed to notify admins");
  }
}