import { Hono } from "hono";
import type { Context, Next } from "hono";
import { zValidator } from "@hono/zod-validator";
import { randomBytes } from "node:crypto";
import type { Document as DocumentPayload } from "@family/core";
import {
  createDocumentRequestSchema,
  uploadDocumentUrlRequestSchema,
} from "@family/core";
import { AppError } from "../middleware/error.js";
import { originCheck, requireAuth } from "../middleware/security.js";
import { newDocumentKey, storage } from "../lib/storage.js";
import { validateBody } from "../lib/validation.js";
import { KulayaDocument } from "../models/document.js";
import { User } from "../models/user.js";

export const documentsRoutes = new Hono();

async function requireApprovedMember(c: Context, next: Next) {
  const user = await User.findById(c.get("userId"), { adminApprovalStatus: 1 });
  if (!user || user.adminApprovalStatus !== "approved") {
    throw new AppError(403, "FORBIDDEN", "Your account must be approved first");
  }
  await next();
}

documentsRoutes.use("*", originCheck, requireAuth, requireApprovedMember);

/** Step 1: get a scoped upload URL (direct to R2 in production). */
documentsRoutes.post(
  "/upload-url",
  zValidator("json", uploadDocumentUrlRequestSchema),
  async (c) => {
    const { mimeType, size } = c.req.valid("json");

    const key = newDocumentKey(mimeType);
    const uploadUrl = await storage.requestUploadUrl({ key, mimeType, size });

    return c.json({ uploadUrl, key });
  },
);

/** Step 2: after the browser PUT the bytes, register the document. */
documentsRoutes.post("/", validateBody(createDocumentRequestSchema), async (c) => {
  const userId = c.get("userId");
  const { key, name, mimeType, size, description } = c.req.valid("json");

  const existing = await KulayaDocument.findOne({ key });
  if (existing) throw new AppError(409, "CONFLICT", "Document already registered");

  await storage.confirmUpload(key, { mimeType, size });

  // Keep only the basename — never store path separators from uploads.
  const safeName = name.split(/[\\/]/).pop() ?? "document";

  const document = await KulayaDocument.create({
    key,
    name: safeName,
    mimeType,
    size,
    description: description ?? undefined,
    uploadedBy: userId,
  });

  return c.json({ document: await toDocumentPayload(await findPopulatedDocument(document._id.toString())) });
});

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
  return c.json({ document: await toDocumentPayload(await findPopulatedDocument(c.req.param("id"))) });
});

/** Redirect to a signed storage URL that forces a download. */
documentsRoutes.get("/:id/download", async (c) => {
  const document = await KulayaDocument.findById(c.req.param("id")).lean();
  if (!document) throw new AppError(404, "NOT_FOUND", "Document not found");
  const url = await storage.getObjectUrl(document.key, { filename: document.name });
  return c.redirect(url, 302);
});

documentsRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId");

  const document = await KulayaDocument.findById(c.req.param("id"));
  if (!document) throw new AppError(404, "NOT_FOUND", "Document not found");

  await assertCanManage(document, userId);

  await storage.deleteObject(document.key);
  await document.deleteOne();

  return c.json({ ok: true });
});

/** Create (or keep) the public share link and return its path. */
documentsRoutes.post("/:id/share", async (c) => {
  const userId = c.get("userId");

  const document = await KulayaDocument.findById(c.req.param("id"));
  if (!document) throw new AppError(404, "NOT_FOUND", "Document not found");

  await assertCanManage(document, userId);

  if (!document.shareToken) {
    document.shareToken = randomBytes(24).toString("base64url");
    await document.save();
  }

  return c.json({ url: `/api/shared/documents/${document.shareToken}` });
});

/** Revoke the public share link. */
documentsRoutes.delete("/:id/share", async (c) => {
  const userId = c.get("userId");

  const document = await KulayaDocument.findById(c.req.param("id"));
  if (!document) throw new AppError(404, "NOT_FOUND", "Document not found");

  await assertCanManage(document, userId);

  document.shareToken = undefined;
  await document.save();

  return c.json({ url: null });
});

async function assertCanManage(
  document: { uploadedBy: { toString(): string } },
  userId: string,
): Promise<void> {
  const user = await User.findById(userId, { role: 1 });
  const isOwner = document.uploadedBy.toString() === userId;
  if (!isOwner && user?.role !== "admin") {
    throw new AppError(403, "FORBIDDEN", "Only the uploader or an admin can manage documents");
  }
}

interface PopulatedDocument {
  _id: unknown;
  key: string;
  name: string;
  mimeType: string;
  size: number;
  description?: string;
  shareToken?: string;
  uploadedBy: { _id: { toString(): string }; name: string; username: string };
  createdAt: Date;
  updatedAt: Date;
}

async function toDocumentPayload(document: PopulatedDocument): Promise<DocumentPayload> {
  return {
    id: String(document._id),
    name: document.name,
    mimeType: document.mimeType as DocumentPayload["mimeType"],
    size: document.size,
    description: document.description ?? null,
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