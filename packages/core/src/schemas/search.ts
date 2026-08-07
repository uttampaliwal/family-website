import { z } from "zod";
import { chatMessageSchema } from "./chat.js";
import { documentSchema } from "./documents.js";
import { eventSchema } from "./events.js";
import { memberPublicSchema } from "./members.js";
import { photoSchema } from "./photos.js";
import { postSchema } from "./posts.js";

/** q must be trimmed, non-empty and short enough to stay index-friendly. */
export const searchRequestSchema = z.object({
  q: z.string().trim().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

/** Grouped results across the whole nest — everything the family can see. */
export const searchResponseSchema = z.object({
  q: z.string(),
  people: z.array(memberPublicSchema),
  photos: z.array(photoSchema),
  posts: z.array(postSchema),
  events: z.array(eventSchema),
  documents: z.array(documentSchema),
  messages: z.array(chatMessageSchema),
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;