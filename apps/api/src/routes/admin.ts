import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { adminDecisionSchema, adminMemberListSchema } from "@family/core";
import { AppError } from "../middleware/error.js";
import { originCheck, requireAdmin } from "../middleware/security.js";
import { toAdminMember } from "../lib/payloads.js";
import { validateBody } from "../lib/validation.js";
import { User } from "../models/user.js";

export const adminRoutes = new Hono();

adminRoutes.use("*", originCheck, requireAdmin);

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

    user.adminApprovalStatus = status;
    if (status === "approved") user.approvedAt = new Date();
    if (role !== undefined) user.role = role;
    await user.save();

    return c.json({ member: toAdminMember(user) });
  },
);
