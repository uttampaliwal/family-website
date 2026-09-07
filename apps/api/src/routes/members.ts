import { memberListSchema, updateProfileSchema } from "@family/core";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { toPublicMember } from "../lib/payloads.js";
import { buildTree } from "../lib/tree.js";
import { validateBody } from "../lib/validation.js";
import { AppError } from "../middleware/error.js";
import { originCheck, requireApprovedAuth } from "../middleware/security.js";
import { User } from "../models/user.js";

export const membersRoutes = new Hono();

membersRoutes.use("*", originCheck, requireApprovedAuth);

membersRoutes.get("/", zValidator("query", memberListSchema), async (c) => {
  const { page, pageSize, search } = c.req.valid("query");

  const filter: Record<string, unknown> = { adminApprovalStatus: "approved" };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { username: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ name: 1 })
      .skip(page * pageSize)
      .limit(pageSize)
      .exec(),
    User.countDocuments(filter),
  ]);

  return c.json({
    items: users.map(toPublicMember),
    total,
    page,
    pageSize,
  });
});

membersRoutes.patch("/me", validateBody(updateProfileSchema), async (c) => {
  const userId = c.get("userId");
  const input = c.req.valid("json");

  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "NOT_FOUND", "Account not found");

  if (input.name !== undefined) user.name = input.name;
  if (input.relationship !== undefined) user.relationship = input.relationship;
  if (input.phoneNumber !== undefined) {
    user.phoneNumber = input.phoneNumber?.trim()
      ? input.phoneNumber
      : undefined;
  }

  await user.save();
  return c.json({ member: toPublicMember(user) });
});

membersRoutes.get("/tree", async (c) => {
  return c.json(await buildTree());
});

membersRoutes.get("/:id", async (c) => {
  const user = await User.findOne({
    _id: c.req.param("id"),
    adminApprovalStatus: "approved",
  });
  if (!user) throw new AppError(404, "NOT_FOUND", "Member not found");
  return c.json({ member: toPublicMember(user) });
});
