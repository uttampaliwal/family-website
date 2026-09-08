import { env } from "../config/env.js";
import { AppError } from "../middleware/error.js";
import { KulayaDocument } from "../models/document.js";
import { Photo } from "../models/photo.js";

/**
 * Upload quotas (P2): per-member daily bytes + file count, plus a family
 * total ceiling. Counters are in-memory — consistent with the in-memory
 * rate limiter and appropriate for family scale; usage is recorded only
 * when metadata registration succeeds, so abandoned uploads cost nothing.
 */

interface DayCounter {
  day: string;
  bytes: number;
  files: number;
}

const counters = new Map<string, DayCounter>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function counterFor(userId: string): DayCounter {
  const today = todayKey();
  const existing = counters.get(userId);
  if (existing && existing.day === today) return existing;
  const fresh: DayCounter = { day: today, bytes: 0, files: 0 };
  counters.set(userId, fresh);
  return fresh;
}

/** Drop stale day buckets periodically. */
setInterval(() => {
  const today = todayKey();
  for (const [key, counter] of counters) {
    if (counter.day !== today) counters.delete(key);
  }
}, 60_000).unref();

export async function familyUsageBytes(): Promise<number> {
  const [photos, documents] = await Promise.all([
    Photo.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: "$size" } } },
    ]),
    KulayaDocument.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: "$size" } } },
    ]),
  ]);
  return (photos[0]?.total ?? 0) + (documents[0]?.total ?? 0);
}

/** Enforced when an upload URL is requested (before any bytes move). */
export async function checkUploadQuota(
  userId: string,
  size: number,
): Promise<void> {
  const counter = counterFor(userId);
  if (counter.files + 1 > env.UPLOAD_DAILY_FILES) {
    throw new AppError(
      429,
      "UPLOAD_QUOTA_EXCEEDED",
      "Daily upload count reached — try again tomorrow",
    );
  }
  if (counter.bytes + size > env.UPLOAD_DAILY_BYTES) {
    throw new AppError(
      429,
      "UPLOAD_QUOTA_EXCEEDED",
      "Daily upload limit reached — try again tomorrow",
    );
  }
  const familyTotal = await familyUsageBytes();
  if (familyTotal + size > env.FAMILY_QUOTA_BYTES) {
    throw new AppError(
      413,
      "FAMILY_QUOTA_EXCEEDED",
      "The family archive is full — ask an admin to free up space",
    );
  }
}

/** Called only after metadata registration succeeds. */
export function recordUploadUsage(userId: string, size: number): void {
  const counter = counterFor(userId);
  counter.files += 1;
  counter.bytes += size;
}
