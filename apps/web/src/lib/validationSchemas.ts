import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email is too long');

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username is too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores');

const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(50, 'Name is too long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: nameSchema,
  lastName: nameSchema,
  dateOfBirth: z.string()
    .min(1, 'Date of birth is required')
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 13 && age <= 120;
    }, 'You must be between 13 and 120 years old'),
  termsAccepted: z.boolean()
    .refine((val) => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
  token: z.string().min(1, 'Reset token is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// Profile schemas
export const updateProfileSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  email: emailSchema.optional(),
  dateOfBirth: z.string().optional(),
  bio: z.string().max(500, 'Bio is too long').optional(),
  location: z.string().max(100, 'Location is too long').optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  phoneNumber: z.string()
    .regex(/^[+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

// Document schemas
export const createDocumentSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title is too long'),
  content: z.string()
    .min(1, 'Content is required')
    .max(50000, 'Content is too long'),
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category is too long'),
  tags: z.array(z.string().max(30, 'Tag is too long'))
    .max(10, 'Too many tags')
    .optional(),
  isPrivate: z.boolean().default(false),
});

export const updateDocumentSchema = createDocumentSchema.partial().extend({
  id: z.string().min(1, 'Document ID is required'),
});

export const shareDocumentSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  email: emailSchema,
  permission: z.enum(['read', 'write'], {
    errorMap: () => ({ message: 'Permission must be either read or write' }),
  }),
  message: z.string().max(500, 'Message is too long').optional(),
});

// Contact form schema
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string()
    .min(1, 'Subject is required')
    .max(100, 'Subject is too long'),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message is too long'),
});

// Search schema
export const searchSchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(100, 'Search query is too long'),
  category: z.string().optional(),
  sortBy: z.enum(['relevance', 'date', 'title']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports for TypeScript
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type CreateDocumentFormData = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentFormData = z.infer<typeof updateDocumentSchema>;
export type ShareDocumentFormData = z.infer<typeof shareDocumentSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;