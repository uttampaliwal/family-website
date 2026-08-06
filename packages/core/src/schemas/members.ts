import { z } from "zod";
import { email, name, objectId, phoneNumber, username } from "./common.js";
import { genderSchema, relationshipSchema } from "./auth.js";

/** What a signed-in member may see of another member. */
export const memberPublicSchema = z.object({
  id: objectId,
  name,
  username,
  gender: genderSchema,
  relationship: relationshipSchema.nullable(),
  role: z.enum(["user", "admin"]),
  avatarUrl: z.string().url().nullable(),
  parentIds: z.array(objectId).default([]),
  joinedAt: z.coerce.date(),
});

/** Full record — only visible to admins. */
export const adminMemberSchema = z.object({
  id: objectId,
  name,
  email,
  username,
  gender: genderSchema,
  relationship: relationshipSchema.nullable(),
  phoneNumber: phoneNumber.nullable(),
  role: z.enum(["user", "admin"]),
  isVerified: z.boolean(),
  adminApprovalStatus: z.enum(["pending", "approved", "rejected"]),
  approvedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  dateOfBirth: z.coerce.date(),
  parentIds: z.array(objectId).default([]),
});

export const memberListSchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
  search: z.string().trim().max(50).optional(),
});

export const memberListResponseSchema = z.object({
  items: z.array(memberPublicSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().nonnegative(),
  pageSize: z.number().int().positive(),
});

export const adminMemberListSchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
  search: z.string().trim().max(50).optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

export const updateProfileSchema = z.object({
  name: name.optional(),
  relationship: relationshipSchema.nullable().optional(),
  phoneNumber: phoneNumber.nullable().optional(),
});

export const adminDecisionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  role: z.enum(["user", "admin"]).optional(),
});

/** Admin-managed parent links for the family tree. */
export const updateRelationshipsSchema = z.object({
  parentIds: z.array(objectId).max(2, "A member can have at most 2 parents"),
});

/** One node of the family tree (approved members only, no private fields). */
export const treeMemberSchema = z.object({
  id: objectId,
  name,
  username,
  gender: genderSchema,
  relationship: relationshipSchema.nullable(),
  role: z.enum(["user", "admin"]),
  avatarUrl: z.string().url().nullable(),
  generation: z.number().int().nonnegative(),
  parentIds: z.array(objectId),
  childrenIds: z.array(objectId),
});

export const treeResponseSchema = z.object({
  roots: z.array(objectId),
  members: z.array(treeMemberSchema),
});

export type MemberPublic = z.infer<typeof memberPublicSchema>;
export type AdminMember = z.infer<typeof adminMemberSchema>;
export type MemberListInput = z.infer<typeof memberListSchema>;
export type AdminMemberListInput = z.infer<typeof adminMemberListSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AdminDecisionInput = z.infer<typeof adminDecisionSchema>;
export type UpdateRelationshipsInput = z.infer<typeof updateRelationshipsSchema>;
export type TreeMember = z.infer<typeof treeMemberSchema>;
export type TreeResponse = z.infer<typeof treeResponseSchema>;
