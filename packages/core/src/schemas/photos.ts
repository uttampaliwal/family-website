import { z } from "zod";
import { name, objectId, sha256Hex } from "./common.js";

export const photoMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
] as const;

export const photoMimeTypeSchema = z.enum(photoMimeTypes);

export const MAX_PHOTO_SIZE = 20 * 1024 * 1024; // 20 MB

/** Keys are generated server-side (`photos/<uuid>.<ext>`) and echoed back. */
export const photoKeySchema = z
  .string()
  .regex(/^photos\/[a-z0-9-]{36}\.[a-z0-9]{2,5}$/i, "Invalid photo key");

export const uploadUrlRequestSchema = z.object({
  mimeType: photoMimeTypeSchema,
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_PHOTO_SIZE, "Photos can be at most 20 MB"),
  sha256: sha256Hex.optional(),
});

export const createPhotoRequestSchema = z.object({
  key: photoKeySchema,
  mimeType: photoMimeTypeSchema,
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_PHOTO_SIZE, "Photos can be at most 20 MB"),
  caption: z
    .string()
    .trim()
    .max(200, "Captions can be at most 200 characters")
    .optional(),
  sha256: sha256Hex.optional(),
});

export const photoUploaderSchema = z.object({
  id: objectId,
  name,
  username: z.string(),
});

export const photoSchema = z.object({
  id: objectId,
  key: photoKeySchema,
  url: z.string().url(),
  mimeType: photoMimeTypeSchema,
  size: z.number().int().positive(),
  caption: z.string().nullable(),
  sha256: z.string().nullable(),
  uploadedBy: photoUploaderSchema,
  createdAt: z.coerce.date(),
});

export const photoListResponseSchema = z.object({
  items: z.array(photoSchema),
  total: z.number().int().nonnegative(),
});

export type UploadUrlRequest = z.infer<typeof uploadUrlRequestSchema>;
export type CreatePhotoInput = z.infer<typeof createPhotoRequestSchema>;
export type Photo = z.infer<typeof photoSchema>;
export type PhotoListResponse = z.infer<typeof photoListResponseSchema>;
