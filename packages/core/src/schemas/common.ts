import { z } from "zod";

// ─── Shared primitives ────────────────────────────────────────────────

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address");

export const username = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(
    /^[a-z0-9_]+$/i,
    "Username can only contain letters, numbers, and underscores",
  );

export const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

export const phoneNumber = z
  .string()
  .trim()
  .regex(/^[+]?[1-9]\d{1,14}$/, "Enter a valid phone number")
  .optional()
  .or(z.literal(""));

export const name = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name must be at most 100 characters");

export const dateOfBirth = z.coerce.date({
  error: "Enter a valid date of birth",
});

export const pageSize = z.coerce
  .number()
  .int()
  .min(1)
  .max(100)
  .default(20);
export const pageIndex = z.coerce.number().int().min(0).default(0);