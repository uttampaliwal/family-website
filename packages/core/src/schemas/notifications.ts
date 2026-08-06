import { z } from "zod";
import { objectId } from "./common.js";

export const notificationTypes = [
  "announcement",
  "event",
  "moment_like",
  "moment_comment",
  "member_joined",
  "approval",
] as const;

export const notificationTypeSchema = z.enum(notificationTypes);

export const notificationActorSchema = z.object({
  id: objectId,
  name: z.string(),
});

export const notificationSchema = z.object({
  id: objectId,
  type: notificationTypeSchema,
  actor: notificationActorSchema.nullable(),
  body: z.string(),
  link: z.string(),
  readAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

export const notificationListResponseSchema = z.object({
  items: z.array(notificationSchema),
  total: z.number().int().nonnegative(),
  unreadCount: z.number().int().nonnegative(),
});

export const unreadCountResponseSchema = z.object({
  count: z.number().int().nonnegative(),
});

export type Notification = z.infer<typeof notificationSchema>;
export type NotificationListResponse = z.infer<typeof notificationListResponseSchema>;
export type UnreadCountResponse = z.infer<typeof unreadCountResponseSchema>;
