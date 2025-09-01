import { z } from "zod";

export const personalDetailsSchema = z.object({
  name: z.string().min(1, { message: "Full name is required" }),
  dob: z.string().min(1, { message: "Date of birth is required" }),
  mobileNumber: z.string().optional(),
  gender: z.string().min(1, { message: "Gender is required" }),
  relationship: z.string().min(1, { message: "Relationship is required" }),
});

export const accountInformationSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address" }),
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters long" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const registerSchema = personalDetailsSchema.merge(
  accountInformationSchema,
);
