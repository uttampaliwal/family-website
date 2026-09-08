import { z } from "zod";
import { objectId, pageIndex, pageSize } from "./common.js";

/** Everything worth knowing after the fact. Add an action, not a free text. */
export const auditActions = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "LOGOUT",
  "REGISTER",
  "EMAIL_VERIFIED",
  "PASSWORD_CHANGED",
  "PASSWORD_RESET_REQUESTED",
  "PASSWORD_RESET",
  "MEMBER_APPROVED",
  "MEMBER_REJECTED",
  "MEMBER_SUSPENDED",
  "ROLE_CHANGED",
  "PHOTO_UPLOADED",
  "PHOTO_DELETED",
  "DOCUMENT_UPLOADED",
  "DOCUMENT_DELETED",
  "DOCUMENT_SHARED",
  "DOCUMENT_UNSHARED",
  "DOCUMENT_DOWNLOADED",
  "POST_CREATED",
  "POST_DELETED",
  "EVENT_CREATED",
  "EVENT_UPDATED",
  "EVENT_DELETED",
  "EMAIL_DELIVERY_FAILED",
] as const;

export const auditActionSchema = z.enum(auditActions);

export const auditLogSchema = z.object({
  id: objectId,
  actor: z.object({ id: objectId, name: z.string() }).nullable(),
  action: auditActionSchema,
  targetType: z.string().nullable(),
  targetId: objectId.nullable(),
  details: z.record(z.string(), z.unknown()).nullable(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const auditLogListSchema = z.object({
  page: pageIndex,
  pageSize,
  action: auditActionSchema.optional(),
  actorId: objectId.optional(),
});

export const auditLogListResponseSchema = z.object({
  items: z.array(auditLogSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().nonnegative(),
  pageSize: z.number().int().positive(),
});

export type AuditAction = (typeof auditActions)[number];
export type AuditLog = z.infer<typeof auditLogSchema>;
export type AuditLogListInput = z.infer<typeof auditLogListSchema>;
export type AuditLogListResponse = z.infer<typeof auditLogListResponseSchema>;
