import type { Photo as PhotoPayload } from "@family/core";
import {
  can,
  createPhotoRequestSchema,
  uploadUrlRequestSchema,
} from "@family/core";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { clientInfo, recordAudit } from "../lib/audit.js";
import { confirmStoredUpload } from "../lib/file-type.js";
import { checkUploadQuota, recordUploadUsage } from "../lib/quotas.js";
import { newPhotoKey, storage } from "../lib/storage.js";
import { parseObjectIdParam, validateBody } from "../lib/validation.js";
import { AppError } from "../middleware/error.js";
import {
  originCheck,
  requireApprovedAuth,
  requireCapability,
} from "../middleware/security.js";
import { Photo } from "../models/photo.js";
import { User } from "../models/user.js";

export const photosRoutes = new Hono();

photosRoutes.use("*", originCheck, requireApprovedAuth);

/** Step 1: get a scoped upload URL (direct to R2 in production). */
photosRoutes.post(
  "/upload-url",
  requireCapability("uploadPhotos"),
  zValidator("json", uploadUrlRequestSchema),
  async (c) => {
    const { mimeType, size } = c.req.valid("json");

    await checkUploadQuota(c.get("userId"), size);

    const key = newPhotoKey(mimeType);
    const uploadUrl = await storage.requestUploadUrl({ key, mimeType, size });

    return c.json({ uploadUrl, key });
  },
);

/** Step 2: after the browser PUT the bytes, register the photo. */
photosRoutes.post(
  "/",
  requireCapability("uploadPhotos"),
  validateBody(createPhotoRequestSchema),
  async (c) => {
    const userId = c.get("userId");
    const { key, mimeType, size, caption, sha256 } = c.req.valid("json");

    const existing = await Photo.findOne({ key });
    if (existing)
      throw new AppError(409, "CONFLICT", "Photo already registered");

    await confirmStoredUpload(key, { mimeType, size });

    const photo = await Photo.create({
      key,
      mimeType,
      size,
      caption: caption ?? undefined,
      sha256: sha256 ?? undefined,
      uploadedBy: userId,
    });
    recordUploadUsage(userId, size);

    return c.json({
      photo: await toPhotoPayload(
        await findPopulatedPhoto(photo._id.toString()),
      ),
    });
  },
);

photosRoutes.get("/", async (c) => {
  const photos = (await Photo.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("uploadedBy", "name username")
    .lean()) as unknown as PopulatedPhoto[];

  const items = await Promise.all(photos.map(toPhotoPayload));
  return c.json({ items, total: items.length });
});

photosRoutes.get("/:id", async (c) => {
  return c.json({
    photo: await toPhotoPayload(
      await findPopulatedPhoto(parseObjectIdParam(c)),
    ),
  });
});

photosRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");

  const photo = await Photo.findById(parseObjectIdParam(c));
  if (!photo) throw new AppError(404, "NOT_FOUND", "Photo not found");

  const user = await User.findById(userId, { role: 1 });
  const isOwner = photo.uploadedBy.toString() === userId;
  if (!isOwner && !can(user?.role ?? "guest", "moderate")) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "Only the uploader or a moderator can delete photos",
    );
  }

  await storage.deleteObject(photo.key);
  await photo.deleteOne();

  await recordAudit({
    actorId: userId,
    action: "PHOTO_DELETED",
    targetType: "photo",
    targetId: photo._id.toString(),
    details: { key: photo.key, mimeType: photo.mimeType },
    ...clientInfo(c),
  });

  return c.json({ ok: true });
});

export interface PopulatedPhoto {
  _id: { toString(): string };
  key: string;
  mimeType: string;
  size: number;
  caption?: string;
  sha256?: string;
  uploadedBy: { _id: { toString(): string }; name: string; username: string };
  createdAt: Date;
}

export async function toPhotoPayload(
  photo: PopulatedPhoto,
): Promise<PhotoPayload> {
  return {
    id: photo._id.toString(),
    key: photo.key,
    // Gallery view URL: longer window than downloads — the grid stays open
    // while family browses; downloads use the short default TTL.
    url: await storage.getObjectUrl(photo.key, { expiresInSec: 60 * 60 }),
    mimeType: photo.mimeType as PhotoPayload["mimeType"],
    size: photo.size,
    caption: photo.caption ?? null,
    sha256: photo.sha256 ?? null,
    uploadedBy: {
      id: photo.uploadedBy._id.toString(),
      name: photo.uploadedBy.name,
      username: photo.uploadedBy.username,
    },
    createdAt: photo.createdAt,
  };
}

async function findPopulatedPhoto(photoId: string): Promise<PopulatedPhoto> {
  const photo = (await Photo.findById(photoId)
    .populate("uploadedBy", "name username")
    .lean()) as unknown as PopulatedPhoto | null;

  if (!photo) throw new AppError(404, "NOT_FOUND", "Photo not found");
  return photo;
}
