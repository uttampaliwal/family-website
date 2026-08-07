import { Hono } from "hono";
import type { Context, Next } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { Photo as PhotoPayload } from "@family/core";
import { createPhotoRequestSchema, uploadUrlRequestSchema } from "@family/core";
import { AppError } from "../middleware/error.js";
import { originCheck, requireAuth } from "../middleware/security.js";
import { clientInfo, recordAudit } from "../lib/audit.js";
import { newPhotoKey, storage } from "../lib/storage.js";
import { validateBody } from "../lib/validation.js";
import { Photo } from "../models/photo.js";
import { User } from "../models/user.js";

export const photosRoutes = new Hono();

async function requireApprovedMember(c: Context, next: Next) {
  const user = await User.findById(c.get("userId"), { adminApprovalStatus: 1 });
  if (!user || user.adminApprovalStatus !== "approved") {
    throw new AppError(403, "FORBIDDEN", "Your account must be approved first");
  }
  await next();
}

photosRoutes.use("*", originCheck, requireAuth, requireApprovedMember);

/** Step 1: get a scoped upload URL (direct to R2 in production). */
photosRoutes.post(
  "/upload-url",
  zValidator("json", uploadUrlRequestSchema),
  async (c) => {
    const { mimeType, size } = c.req.valid("json");

    const key = newPhotoKey(mimeType);
    const uploadUrl = await storage.requestUploadUrl({ key, mimeType, size });

    return c.json({ uploadUrl, key });
  },
);

/** Step 2: after the browser PUT the bytes, register the photo. */
photosRoutes.post("/", validateBody(createPhotoRequestSchema), async (c) => {
  const userId = c.get("userId");
  const { key, mimeType, size, caption } = c.req.valid("json");

  const existing = await Photo.findOne({ key });
  if (existing) throw new AppError(409, "CONFLICT", "Photo already registered");

  await storage.confirmUpload(key, { mimeType, size });

  const photo = await Photo.create({
    key,
    mimeType,
    size,
    caption: caption ?? undefined,
    uploadedBy: userId,
  });

  return c.json({ photo: await toPhotoPayload(await findPopulatedPhoto(photo._id.toString())) });
});

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
  return c.json({ photo: await toPhotoPayload(await findPopulatedPhoto(c.req.param("id"))) });
});

photosRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");

  const photo = await Photo.findById(c.req.param("id"));
  if (!photo) throw new AppError(404, "NOT_FOUND", "Photo not found");

  const user = await User.findById(userId, { role: 1 });
  const isOwner = photo.uploadedBy.toString() === userId;
  if (!isOwner && user?.role !== "admin") {
    throw new AppError(403, "FORBIDDEN", "Only the uploader or an admin can delete photos");
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
  uploadedBy: { _id: { toString(): string }; name: string; username: string };
  createdAt: Date;
}

export async function toPhotoPayload(photo: PopulatedPhoto): Promise<PhotoPayload> {
  return {
    id: photo._id.toString(),
    key: photo.key,
    url: await storage.getObjectUrl(photo.key),
    mimeType: photo.mimeType as PhotoPayload["mimeType"],
    size: photo.size,
    caption: photo.caption ?? null,
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
