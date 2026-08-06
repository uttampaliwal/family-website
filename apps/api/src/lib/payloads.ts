import type { AdminMember, MemberPublic, User } from "@family/core";
import type { UserDocument } from "../models/user.js";

export function toUserPayload(user: UserDocument): User {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    username: user.username,
    gender: user.gender,
    relationship: user.relationship,
    role: user.role,
    isVerified: user.isVerified,
    avatarUrl: null,
    createdAt: user.createdAt,
  };
}

/** Public member card — no email, phone, or birth date. */
export function toPublicMember(user: UserDocument): MemberPublic {
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    gender: user.gender,
    relationship: user.relationship,
    role: user.role,
    avatarUrl: null,
    joinedAt: user.createdAt,
  };
}

/** Full record for the admin directory. */
export function toAdminMember(user: UserDocument): AdminMember {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    username: user.username,
    gender: user.gender,
    relationship: user.relationship,
    phoneNumber: user.phoneNumber ?? null,
    role: user.role,
    isVerified: user.isVerified,
    adminApprovalStatus: user.adminApprovalStatus,
    approvedAt: user.approvedAt ?? null,
    createdAt: user.createdAt,
    dateOfBirth: user.dateOfBirth,
  };
}
