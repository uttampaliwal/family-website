import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import mongoose from "mongoose";
import {
  adminDecisionSchema,
  adminMemberListSchema,
  auditLogListSchema,
  updateRelationshipsSchema,
} from "@family/core";
import { AppError } from "../middleware/error.js";
import { originCheck, requireAdmin } from "../middleware/security.js";
import { clientInfo, recordAudit } from "../lib/audit.js";
import { toAdminMember } from "../lib/payloads.js";
import { assertValidParents } from "../lib/tree.js";
import { validateBody } from "../lib/validation.js";
import { createNotification } from "../lib/notifications.js";
import { AuditLog, type AuditLogDocument } from "../models/audit-log.js";
import { User } from "../models/user.js";

export const adminRoutes = new Hono();

adminRoutes.use("*", originCheck, requireAdmin);

function toAuditLogPayload(log: AuditLogDocument) {
  return {
    id: log._id.toString(),
    actor:
      log.actorId && log.actorName
        ? { id: log.actorId.toString(), name: log.actorName }
        : null,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId?.toString() ?? null,
    details: log.details,
    ip: log.ip,
    userAgent: log.userAgent,
    createdAt: log.createdAt,
  };
}

adminRoutes.get(
  "/audit-logs",
  zValidator("query", auditLogListSchema),
  async (c) => {
    const { page, pageSize, action, actorId } = c.req.valid("query");

    const filter: Record<string, unknown> = {};
    if (action) filter.action = action;
    if (actorId) filter.actorId = actorId;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(page * pageSize)
        .limit(pageSize)
        .exec(),
      AuditLog.countDocuments(filter),
    ]);

    return c.json({
      items: logs.map(toAuditLogPayload),
      total,
      page,
      pageSize,
    });
  },
);

adminRoutes.get(
  "/members",
  zValidator("query", adminMemberListSchema),
  async (c) => {
    const { page, pageSize, search, status } = c.req.valid("query");

    const filter: Record<string, unknown> = {};
    if (status) filter.adminApprovalStatus = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(page * pageSize)
        .limit(pageSize)
        .exec(),
      User.countDocuments(filter),
    ]);

    return c.json({
      items: users.map(toAdminMember),
      total,
      page,
      pageSize,
    });
  },
);

adminRoutes.get("/members/pending-count", async (c) => {
  const count = await User.countDocuments({ adminApprovalStatus: "pending" });
  return c.json({ count });
});

adminRoutes.get("/members/:id", async (c) => {
  const user = await User.findById(c.req.param("id"));
  if (!user) throw new AppError(404, "NOT_FOUND", "Member not found");
  return c.json({ member: toAdminMember(user) });
});

adminRoutes.patch(
  "/members/:id",
  validateBody(adminDecisionSchema),
  async (c) => {
    const { status, role } = c.req.valid("json");

    const user = await User.findById(c.req.param("id"));
    if (!user) throw new AppError(404, "NOT_FOUND", "Member not found");
    if (user._id.toString() === c.get("userId")) {
      throw new AppError(400, "INVALID_OPERATION", "You can't review your own account");
    }

    const previousStatus = user.adminApprovalStatus;
    const previousRole = user.role;

    user.adminApprovalStatus = status;
    if (status === "approved") {
      user.approvedAt = new Date();
      const reviewer = await User.findById(c.get("userId"), "name");
      await createNotification({
        recipientId: user._id.toString(),
        type: "approval",
        actorId: c.get("userId"),
        actorName: reviewer?.name ?? "",
        link: "/",
      });
    }
    if (role !== undefined) user.role = role;
    await user.save();

    if (status !== previousStatus) {
      await recordAudit({
        actorId: c.get("userId"),
        action: status === "approved" ? "MEMBER_APPROVED" : "MEMBER_REJECTED",
        targetType: "user",
        targetId: user._id.toString(),
        details: { member: user.username },
        ...clientInfo(c),
      });
    }
    if (role !== undefined && role !== previousRole) {
      await recordAudit({
        actorId: c.get("userId"),
        action: "ROLE_CHANGED",
        targetType: "user",
        targetId: user._id.toString(),
        details: { member: user.username, from: previousRole, to: role },
        ...clientInfo(c),
      });
    }

    return c.json({ member: toAdminMember(user) });
  },
);

adminRoutes.patch(
  "/members/:id/relationships",
  validateBody(updateRelationshipsSchema),
  async (c) => {
    const { parentIds } = c.req.valid("json");

    const user = await User.findById(c.req.param("id"));
    if (!user) throw new AppError(404, "NOT_FOUND", "Member not found");

    await assertValidParents(user, parentIds);

    user.parentIds = [...new Set(parentIds)].map(
      (id) => new mongoose.Types.ObjectId(id),
    );
    await user.save();

    return c.json({ member: toAdminMember(user) });
  },
);
