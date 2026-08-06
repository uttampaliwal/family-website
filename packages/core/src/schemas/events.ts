import { z } from "zod";
import { name, objectId } from "./common.js";

export const eventTypes = [
  "birthday",
  "anniversary",
  "gathering",
  "ceremony",
  "other",
] as const;

export const eventTypeSchema = z.enum(eventTypes);

export const eventRecurrences = ["none", "yearly"] as const;

export const eventRecurrenceSchema = z.enum(eventRecurrences).default("none");

/** An event wall-clock range. Yearly events store their first occurrence. */
const eventFields = z.object({
  title: name,
  type: eventTypeSchema.default("gathering"),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  description: z.string().trim().max(500, "Description can be at most 500 characters").optional(),
  recurrence: eventRecurrenceSchema,
});

export const createEventRequestSchema = eventFields.refine(
  (e) => e.endsAt === undefined || e.endsAt >= e.startsAt,
  {
    path: ["endsAt"],
    message: "End time must be after the start time",
  },
);

export const updateEventRequestSchema = eventFields.partial();

export const eventAuthorSchema = z.object({
  id: objectId,
  name,
  username: z.string(),
});

export const eventSchema = z.object({
  id: objectId,
  title: name,
  type: eventTypeSchema,
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().nullable(),
  description: z.string().nullable(),
  recurrence: eventRecurrenceSchema,
  createdBy: eventAuthorSchema,
  createdAt: z.coerce.date(),
});

export const eventListSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const eventListResponseSchema = z.object({
  items: z.array(eventSchema),
  total: z.number().int().nonnegative(),
});

export type CreateEventInput = z.infer<typeof createEventRequestSchema>;
export type UpdateEventInput = z.infer<typeof updateEventRequestSchema>;
export type Event = z.infer<typeof eventSchema>;
export type EventListResponse = z.infer<typeof eventListResponseSchema>;