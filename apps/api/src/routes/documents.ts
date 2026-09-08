import type { Document as DocumentPayload } from "@family/core";
import {
  can,
  createDocumentRequestSchema,
  uploadDocumentUrlRequestSchema,
} from "@family/core";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { randomBytes } from "node:crypto";
import { clientInfo, recordAudit } from "../lib/audit.js";
import { confirmStoredUpload } from "../lib/file-type.js";
import { checkUploadQuota, recordUploadUsage } from "../lib/quotas.js";
import { newDocumentKey, storage } from "../lib/storage.js";
import { parseObjectIdParam, validateBody } from "../lib/validation.js";
import { AppError } from "../middleware/error.js";
import {
  originCheck,
  requireApprovedAuth,
  requireCapability,
} from "../middleware/security.js";
import { KulayaDocument } from "../models/document.js";
import { User } from "../models/user.js";

export const documentsRoutes = new Hono();

documentsRoutes.use("*", originCheck, requireApprovedAuth);

/** Step 1: get a scoped upload URL (direct to R2 in production). */
documentsRoutes.post(
  "/upload-url",
  requireCapability("uploadDocuments"),
  zValidator("json", uploadDocumentUrlRequestSchema),
  async (c) => {
    const { mimeType, size } = c.req.valid("json");

    await checkUploadQuota(c.get("userId"), size);

    const key = newDocumentKey(mimeType);
    const uploadUrl = await storage.requestUploadUrl({ key, mimeType, size });

    return c.json({ uploadUrl, key });
  },
);

/** Step 2: after the browser PUT the bytes, register the document. */
documentsRoutes.post(
  "/",
  requireCapability("uploadDocuments"),
  validateBody(createDocumentRequestSchema),
  async (c) => {
    const userId = c.get("userId");
    const { key, name, mimeType, size, description, sha256 } =
      c.req.valid("json");

    const existing = await KulayaDocument.findOne({ key });
    if (existing)
      throw new AppError(409, "CONFLICT", "Document already registered");

    await confirmStoredUpload(key, { mimeType, size });

    // Keep only the basename — never store path separators from uploads.
    const safeName = name.split(/[\\/]/).pop() ?? "document";

    const document = await KulayaDocument.create({
      key,
      name: safeName,
      mimeType,
      size,
      description: description ?? undefined,
      sha256: sha256 ?? undefined,
      uploadedBy: userId,
    });
    recordUploadUsage(userId, size);

    await recordAudit({
      actorId: userId,
      action: "DOCUMENT_UPLOADED",
      targetType: "document",
      targetId: document._id.toString(),
      details: { name: document.name, key: document.key, size: document.size },
      ...clientInfo(c),
    });

    return c.json({
      document: await toDocumentPayload(
        await findPopulatedDocument(document._id.toString()),
      ),
    });
  },
);

documentsRoutes.get("/", async (c) => {
  const documents = (await KulayaDocument.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("uploadedBy", "name username")
    .lean()) as unknown as PopulatedDocument[];

  const items = await Promise.all(documents.map(toDocumentPayload));
  return c.json({ items, total: items.length });
});

documentsRoutes.get("/:id", async (c) => {
  return c.json({
    document: await toDocumentPayload(
      await findPopulatedDocument(parseObjectIdParam(c)),
    ),
  });
});

/** Authenticated download: returns a short-lived signed URL as JSON so the
 * browser fetch (which carries the bearer token) can navigate to it. A bare
 * `<a href>` cannot send Authorization headers, so this endpoint must NOT
 * 302-redirect — the client navigates to the returned URL itself. */
documentsRoutes.get("/:id/download", async (c) => {
  const userId = c.get("userId");
  const document = await KulayaDocument.findById(parseObjectIdParam(c)).lean();
  if (!document) throw new AppError(404, "NOT_FOUND", "Document not found");
  const url = await storage.getObjectUrl(document.key, {
    filename: document.name,
  });

  await recordAudit({
    actorId: userId,
    action: "DOCUMENT_DOWNLOADED",
    targetType: "document",
    targetId: document._id.toString(),
    details: { name: document.name },
    ...clientInfo(c),
  });

  return c.json({ url });
});

documentsRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");

  const document = await KulayaDocument.findById(parseObjectIdParam(c));
  if (!document) throw new AppError(404, "NOT_FOUND", "Document not found");

  await assertCanManage(document, userId);

  await storage.deleteObject(document.key);
  await document.deleteOne();

  await recordAudit({
    actorId: userId,
    action: "DOCUMENT_DELETED",
    targetType: "document",
    targetId: document._id.toString(),
    details: { name: document.name, key: document.key },
    ...clientInfo(c),
  });

  return c.json({ ok: true });
});

/** Create (or keep) the public share link and return its path. */
documentsRoutes.post("/:id/share", async (c) => {
  const userId = c.get("userId");

  const document = await KulayaDocument.findById(parseObjectIdParam(c));
  if (!document) throw new AppError(404, "NOT_FOUND", "Document not found");

  await assertCanManage(document, userId);

  if (!document.shareToken) {
    document.shareToken = randomBytes(24).toString("base64url");
    await document.save();
  }

  await recordAudit({
    actorId: userId,
    action: "DOCUMENT_SHARED",
    targetType: "document",
    targetId: document._id.toString(),
    details: {
      name: document.name,
      url: `/api/shared/documents/${document.shareToken}`,
    },
    ...clientInfo(c),
  });

  return c.json({ url: `/api/shared/documents/${document.shareToken}` });
});

/** Revoke the public share link. */
documentsRoutes.delete("/:id/share", async (c) => {
  const userId = c.get("userId");

  const document = await KulayaDocument.findById(parseObjectIdParam(c));
  if (!document) throw new AppError(404, "NOT_FOUND", "Document not found");

  await assertCanManage(document, userId);

  document.shareToken = undefined;
  await document.save();

  await recordAudit({
    actorId: userId,
    action: "DOCUMENT_UNSHARED",
    targetType: "document",
    targetId: document._id.toString(),
    details: { name: document.name },
    ...clientInfo(c),
  });

  return c.json({ url: null });
});

async function assertCanManage(
  document: { uploadedBy: { toString(): string } },
  userId: string,
): Promise<void> {
  const user = await User.findById(userId, { role: 1 });
  const isOwner = document.uploadedBy.toString() === userId;
  if (!isOwner && !can(user?.role ?? "guest", "moderate")) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "Only the uploader or a moderator can manage documents",
    );
  }
}

export interface PopulatedDocument {
  _id: unknown;
  key: string;
  name: string;
  mimeType: string;
  size: number;
  description?: string;
  shareToken?: string;
  sha256?: string;
  uploadedBy: { _id: { toString(): string }; name: string; username: string };
  createdAt: Date;
  updatedAt: Date;
}

export async function toDocumentPayload(
  document: PopulatedDocument,
): Promise<DocumentPayload> {
  return {
    id: String(document._id),
    name: document.name,
    mimeType: document.mimeType as DocumentPayload["mimeType"],
    size: document.size,
    description: document.description ?? null,
    sha256: document.sha256 ?? null,
    uploadedBy: {
      id: document.uploadedBy._id.toString(),
      name: document.uploadedBy.name,
      username: document.uploadedBy.username,
    },
    shareUrl: document.shareToken
      ? `/api/shared/documents/${document.shareToken}`
      : null,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

async function findPopulatedDocument(
  documentId: string,
): Promise<PopulatedDocument> {
  const document = (await KulayaDocument.findById(documentId)
    .populate("uploadedBy", "name username")
    .lean()) as unknown as PopulatedDocument | null;

  if (!document) throw new AppError(404, "NOT_FOUND", "Document not found");
  return document;
}
