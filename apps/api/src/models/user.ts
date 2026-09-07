import {
  genderSchema,
  relationshipSchema,
  rolesSchema,
  type Role,
} from "@family/core";
import mongoose, { type Document, type Model } from "mongoose";
import type { z } from "zod";

export interface UserDocument extends Document {
  name: string;
  email: string;
  username: string;
  passwordHash: string;
  dateOfBirth: Date;
  gender: z.infer<typeof genderSchema>;
  relationship: z.infer<typeof relationshipSchema> | null;
  phoneNumber?: string;

  isVerified: boolean;
  verificationTokenHash?: string;
  verificationTokenExpires?: Date;

  parentIds: mongoose.Types.ObjectId[];

  resetPasswordTokenHash?: string;
  resetPasswordExpires?: Date;

  refreshTokenHashes: string[];

  /**
   * Refresh-session family records. Each session holds its current refresh
   * JTI hash plus the superseded hash inside a ≤10s replay grace window, so
   * a legitimate multi-tab refresh race returns SESSION_ROTATED (retry with
   * the current cookie) instead of triggering reuse-theft revocation.
   */
  refreshSessions: Array<{
    jtiHash: string;
    prevJtiHash?: string;
    prevValidUntil?: Date;
    createdAt: Date;
  }>;

  role: Role;
  adminApprovalStatus: "pending" | "approved" | "rejected" | "suspended";
  approvedAt?: Date;

  /**
   * Security version embedded in every access token (`av` claim) and checked
   * by requireApprovedAuth. Bumped on reject/suspend/role-change/password
   * reset/email change so outstanding access tokens die immediately instead
   * of living out their 15-minute TTL.
   */
  authVersion: number;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    passwordHash: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, required: true, enum: genderSchema.options },
    relationship: {
      type: String,
      enum: relationshipSchema.options,
      default: null,
    },
    phoneNumber: { type: String, default: undefined },

    isVerified: { type: Boolean, default: false },
    verificationTokenHash: { type: String, default: undefined },
    verificationTokenExpires: { type: Date, default: undefined },

    resetPasswordTokenHash: { type: String, default: undefined },
    resetPasswordExpires: { type: Date, default: undefined },

    // Legacy flat hashes (pre-P1) — drained into refreshSessions on next
    // refresh so existing sessions survive the deploy; see rotateRefreshSession.
    refreshTokenHashes: { type: [String], default: [] },

    refreshSessions: {
      type: [
        {
          jtiHash: { type: String, required: true },
          prevJtiHash: { type: String, default: undefined },
          prevValidUntil: { type: Date, default: undefined },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    parentIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },

    role: { type: String, enum: rolesSchema.options, default: "child" },
    adminApprovalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    approvedAt: { type: Date, default: undefined },
    authVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ adminApprovalStatus: 1 });

export const User: Model<UserDocument> = mongoose.model<UserDocument>(
  "User",
  userSchema,
);
