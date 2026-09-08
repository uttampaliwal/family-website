import type { Document, Model } from "mongoose";
import { storage } from "./storage.js";

/** Trash retention: entries older than this are eligible for purging. */
export const TRASH_RETENTION_DAYS = 30;

/**
 * Permanently deletes trashed rows older than the retention window,
 * removing stored bytes first so no orphan is left behind. Returns the
 * number of purged rows. Moderator-gated at the route layer.
 */
export async function purgeExpiredTrash<
  T extends Document & { key: string; deletedAt?: Date },
>(model: Model<T>, olderThanDays = TRASH_RETENTION_DAYS): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanDays * 86400_000);
  const expired = await model.find({ deletedAt: { $lt: cutoff } }, { key: 1 });
  for (const doc of expired) {
    await storage.deleteObject(doc.key);
    await doc.deleteOne();
  }
  return expired.length;
}
