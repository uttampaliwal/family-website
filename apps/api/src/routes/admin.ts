import {
  adminDecisionSchema,
  adminMemberListSchema,
  auditLogListSchema,
  canAssignRole,
  updateRelationshipsSchema,
} from "@family/core";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import mongoose from "mongoose";
import { clientInfo, recordAudit } from "../lib/audit.js";
import { createNotification } from "../lib/notifications.js";
import { toAdminMember } from "../lib/payloads.js";
import { assertValidParents } from "../lib/tree.js";
import { validateBody } from "../lib/validation.js";
import { AppError } from "../middleware/error.js";
import { originCheck, requireCapability } from "../middleware/security.js";
import { AuditLog, type AuditLogDocument } from "../models/audit-log.js";
import { User } from "../models/user.js";

export const adminRoutes = new Hono();

adminRoutes.use("*", originCheck);

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
  requireCapability("viewAudit"),
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
  requireCapability("manageMembers"),
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

adminRoutes.get(
  "/members/pending-count",
  requireCapability("manageMembers"),
  async (c) => {
    const count = await User.countDocuments({ adminApprovalStatus: "pending" });
    return c.json({ count });
  },
);

adminRoutes.get(
  "/members/:id",
  requireCapability("manageMembers"),
  async (c) => {
    const user = await User.findById(c.req.param("id"));
    if (!user) throw new AppError(404, "NOT_FOUND", "Member not found");
    return c.json({ member: toAdminMember(user) });
  },
);

adminRoutes.patch(
  "/members/:id",
  requireCapability("manageMembers"),
  validateBody(adminDecisionSchema),
  async (c) => {
    const { status, role } = c.req.valid("json");

    const user = await User.findById(c.req.param("id"));
    if (!user) throw new AppError(404, "NOT_FOUND", "Member not found");
    if (user._id.toString() === c.get("userId")) {
      throw new AppError(
        400,
        "INVALID_OPERATION",
        "You can't review your own account",
      );
    }

    // New members default to the most restricted tier; an admin can raise it.
    let targetRole = role;
    if (status === "approved" && role === undefined) targetRole = "child";
    if (targetRole !== undefined && targetRole !== user.role) {
      if (!canAssignRole(c.get("userRole"), user.role, targetRole)) {
        throw new AppError(
          403,
          "FORBIDDEN",
          "You can't assign that role to this member",
        );
      }
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
    if (targetRole !== undefined) user.role = targetRole;
    // Atomic fail-closed security transition: membership, role, session
    // wipe and authVersion move in a single document save, so a rejected /
    // suspended / demoted member can never be left with live tokens.
    if (
      status !== previousStatus ||
      (targetRole !== undefined && targetRole !== previousRole)
    ) {
      user.refreshTokenHashes = [];
      user.refreshSessions = [];
      user.authVersion += 1;
    }
    await user.save();

    if (status !== previousStatus) {
      await recordAudit({
        actorId: c.get("userId"),
        action:
          status === "approved"
            ? "MEMBER_APPROVED"
            : status === "suspended"
              ? "MEMBER_SUSPENDED"
              : "MEMBER_REJECTED",
        targetType: "user",
        targetId: user._id.toString(),
        details: { member: user.username },
        ...clientInfo(c),
      });
    }
    if (targetRole !== undefined && targetRole !== previousRole) {
      await recordAudit({
        actorId: c.get("userId"),
        action: "ROLE_CHANGED",
        targetType: "user",
        targetId: user._id.toString(),
        details: { member: user.username, from: previousRole, to: targetRole },
        ...clientInfo(c),
      });
    }

    return c.json({ member: toAdminMember(user) });
  },
);

adminRoutes.patch(
  "/members/:id/relationships",
  requireCapability("manageTree"),
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
