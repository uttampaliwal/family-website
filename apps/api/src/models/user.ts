import mongoose, { type Document, type Model } from "mongoose";
import type { z } from "zod";
import { genderSchema, relationshipSchema } from "@family/core";

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

  role: "user" | "admin";
  adminApprovalStatus: "pending" | "approved" | "rejected";
  approvedAt?: Date;

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

    refreshTokenHashes: { type: [String], default: [] },

    parentIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },

    role: { type: String, enum: ["user", "admin"], default: "user" },
    adminApprovalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedAt: { type: Date, default: undefined },
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