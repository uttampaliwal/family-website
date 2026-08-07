import { z } from "zod";
import { name, objectId } from "./common.js";
import { memberPublicSchema } from "./members.js";
import { photoSchema } from "./photos.js";
import { eventSchema } from "./events.js";
import { documentSchema } from "./documents.js";

/**
 * Natural-language search ("AI") over family data. Queries are parsed
 * locally by a rule-based parser — no external model, no family data leaves
 * the server. The parser decides an intent, extracts filters (person,
 * keyword, dataset), and can produce a direct answer (e.g. a birthday).
 */
export const nlRequestSchema = z.object({
  q: z.string().trim().min(1).max(200),
});

/** Which dataset the routed results should come from. */
export const nlDatasetSchema = z.enum([
  "all",
  "people",
  "photos",
  "events",
  "documents",
]);

/** High-level understanding of what the family member asked. */
export const nlIntentSchema = z.enum([
  "birthday",
  "photos",
  "documents",
  "events",
  "person",
  "all",
]);

/** Direct answer the parser produced from the family data. */
export const nlBirthdayAnswerSchema = z.object({
  kind: z.literal("birthday"),
  member: z.object({
    id: objectId,
    name,
    dateOfBirth: z.coerce.date(),
  }),
  /** The member's next birthday as a real calendar date. */
  nextOccurrence: z.coerce.date(),
  /** Days until that date (0 = today). */
  daysUntil: z.number().int().min(0),
});

export const nlAnswerSchema = z.discriminatedUnion("kind", [
  nlBirthdayAnswerSchema,
]);

export const nlFiltersSchema = z.object({
  dataset: nlDatasetSchema,
  /** Free-text keyword the rougly-filtered items must match (caption/name). */
  keywords: z.string().optional(),
  /** Member referenced by name in the query (e.g. "grandmother"). */
  personName: z.string().optional(),
  personId: objectId.optional(),
});

export const nlResponseSchema = z.object({
  query: z.string(),
  intent: nlIntentSchema,
  filters: nlFiltersSchema,
  answer: nlAnswerSchema.nullable().default(null),
  people: z.array(memberPublicSchema),
  photos: z.array(photoSchema),
  events: z.array(eventSchema),
  documents: z.array(documentSchema),
});

export type NlRequest = z.infer<typeof nlRequestSchema>;
export type NlDataset = z.infer<typeof nlDatasetSchema>;
export type NlIntent = z.infer<typeof nlIntentSchema>;
export type NlAnswer = z.infer<typeof nlAnswerSchema>;
export type NlBirthdayAnswer = z.infer<typeof nlBirthdayAnswerSchema>;
export type NlFilters = z.infer<typeof nlFiltersSchema>;
export type NlResponse = z.infer<typeof nlResponseSchema>;