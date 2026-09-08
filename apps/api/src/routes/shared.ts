import { Hono } from "hono";
import { storage } from "../lib/storage.js";
import { AppError } from "../middleware/error.js";
import { rateLimit } from "../middleware/security.js";
import { KulayaDocument } from "../models/document.js";

/**
 * Public, unauthenticated endpoints. Currently only document share links —
 * accessed by people outside the family, so no auth, minimal surface.
 */
export const sharedRoutes = new Hono();

sharedRoutes.get(
  "/documents/:token",
  rateLimit({ windowMs: 60_000, max: 60, name: "shared-document" }),
  async (c) => {
    const document = await KulayaDocument.findOne({
      shareToken: c.req.param("token"),
      deletedAt: { $exists: false },
    }).lean();
    if (!document)
      throw new AppError(404, "NOT_FOUND", "Link invalid or revoked");

    const url = await storage.getObjectUrl(document.key, {
      filename: document.name,
    });
    return c.redirect(url, 302);
  },
);
