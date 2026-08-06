import { z } from "zod";
import { name, objectId } from "./common.js";

export const announcementBodyMaxLength = 2000;

const announcementFields = z.object({
  title: name,
  body: z
    .string()
    .trim()
    .min(1, "Announcement text is required")
    .max(announcementBodyMaxLength, `Announcement can be at most ${announcementBodyMaxLength} characters`),
});

export const createAnnouncementRequestSchema = announcementFields;

export const updateAnnouncementRequestSchema = announcementFields.partial();

export const announcementAuthorSchema = z.object({
  id: objectId,
  name,
  username: z.string(),
});

export const announcementSchema = z.object({
  id: objectId,
  title: name,
  body: z.string(),
  createdBy: announcementAuthorSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const announcementListResponseSchema = z.object({
  items: z.array(announcementSchema),
  total: z.number().int().nonnegative(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementRequestSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementRequestSchema>;
export type Announcement = z.infer<typeof announcementSchema>;
export type AnnouncementListResponse = z.infer<typeof announcementListResponseSchema>;
