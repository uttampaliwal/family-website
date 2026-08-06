import { z } from "zod";
import {
  dateOfBirth,
  email,
  name,
  password,
  phoneNumber,
  username,
} from "./common.js";

export const genderSchema = z.enum(["male", "female", "prefer_not"]);
export const relationshipSchema = z.enum([
  "self",
  "father",
  "mother",
  "son",
  "daughter",
  "brother",
  "sister",
  "husband",
  "wife",
  "grandfather",
  "grandmother",
  "uncle",
  "aunt",
  "cousin",
  "nephew",
  "niece",
  "son_in_law",
  "daughter_in_law",
  "brother_in_law",
  "sister_in_law",
  "other",
]);

export const registerSchema = z.object({
  name,
  email,
  username,
  password,
  dateOfBirth,
  gender: genderSchema,
  relationship: relationshipSchema,
  phoneNumber,
});

export const loginSchema = z.object({
  email: email.or(username),
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({ token: z.string().min(1) });

export const resendVerificationSchema = z.object({ email });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: password,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ─── Response types (shared with the web app) ────────────────────────

export const userSchema = z.object({
  id: z.string(),
  name,
  email,
  username,
  gender: genderSchema,
  relationship: relationshipSchema.nullable(),
  role: z.enum(["user", "admin"]),
  isVerified: z.boolean(),
  avatarUrl: z.string().url().nullable(),
  createdAt: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;
export type SafeUser = User;

export const authResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("ok"),
    user: userSchema,
  }),
  z.object({
    status: z.literal("error"),
    message: z.string(),
  }),
]);

export type AuthResponse = z.infer<typeof authResponseSchema>;
