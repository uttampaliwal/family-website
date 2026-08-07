import type { Context } from "hono";
import type { AuditAction } from "@family/core";
import { AuditLog } from "../models/audit-log.js";
import { User } from "../models/user.js";
import { logger } from "./logger.js";

export interface RecordAuditInput {
  actorId?: string | null;
  actorName?: string | null;
  action: AuditAction;
  targetType?: string | null;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Writes an immutable audit entry. Failures never break the caller: the
 * entry is best-effort, anything that goes wrong is logged and the main
 * request continues.
 */
export async function recordAudit(input: RecordAuditInput): Promise<void> {
  try {
    let actorName = input.actorName ?? null;
    if (!actorName && input.actorId) {
      const user = await User.findById(input.actorId, { name: 1 }).lean();
      actorName = user?.name ?? null;
    }

    await AuditLog.create({
      actorId: input.actorId ?? null,
      actorName,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      details: input.details ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    });
  } catch (err) {
    logger.error({ err, action: input.action }, "Failed to record audit log");
  }
}

/** Client metadata (IP, user agent) shared by every audited route. */
export function clientInfo(
  c: Context,
): { ip: string | null; userAgent: string | null } {
  const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  return { ip, userAgent: c.req.header("user-agent") ?? null };
}