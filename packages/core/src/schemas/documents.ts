import { z } from "zod";
import { name, objectId } from "./common.js";

export const documentMimeTypes = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
] as const;

export const documentMimeTypeSchema = z.enum(documentMimeTypes);

export const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25 MB

/** Original file name, sanitized server-side (basename only). */
export const documentFilenameSchema = z
  .string()
  .trim()
  .min(1, "File name is required")
  .max(120, "File name can be at most 120 characters");

/** Keys are generated server-side (`documents/<uuid>.<ext>`) and echoed back. */
export const documentKeySchema = z
  .string()
  .regex(/^documents\/[a-z0-9-]{36}\.[a-z0-9]{2,5}$/i, "Invalid document key");

export const uploadDocumentUrlRequestSchema = z.object({
  name: documentFilenameSchema,
  mimeType: documentMimeTypeSchema,
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_DOCUMENT_SIZE, "Documents can be at most 25 MB"),
});

export const createDocumentRequestSchema = z.object({
  key: documentKeySchema,
  name: documentFilenameSchema,
  mimeType: documentMimeTypeSchema,
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_DOCUMENT_SIZE, "Documents can be at most 25 MB"),
  description: z
    .string()
    .trim()
    .max(500, "Descriptions can be at most 500 characters")
    .optional(),
});

export const documentUploaderSchema = z.object({
  id: objectId,
  name,
  username: z.string(),
});

export const documentSchema = z.object({
  id: objectId,
  name: documentFilenameSchema,
  mimeType: documentMimeTypeSchema,
  size: z.number().int().positive(),
  description: z.string().nullable(),
  uploadedBy: documentUploaderSchema,
  /** Public share path (`/api/shared/documents/<token>`), or null. */
  shareUrl: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const documentListResponseSchema = z.object({
  items: z.array(documentSchema),
  total: z.number().int().nonnegative(),
});

export type UploadDocumentUrlRequest = z.infer<typeof uploadDocumentUrlRequestSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentRequestSchema>;
export type Document = z.infer<typeof documentSchema>;
export type DocumentListResponse = z.infer<typeof documentListResponseSchema>;
