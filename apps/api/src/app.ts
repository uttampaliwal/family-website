import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { readFile } from "node:fs/promises";
import { env } from "./config/env.js";
import { errorHandler, notFound, requestLogger } from "./middleware/error.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { membersRoutes } from "./routes/members.js";
import { adminRoutes } from "./routes/admin.js";
import { photosRoutes } from "./routes/photos.js";
import { eventsRoutes } from "./routes/events.js";
import { announcementsRoutes } from "./routes/announcements.js";
import { documentsRoutes } from "./routes/documents.js";
import { sharedRoutes } from "./routes/shared.js";
import { postsRoutes } from "./routes/posts.js";
import { chatRoutes } from "./routes/chat.js";
import { notificationsRoutes } from "./routes/notifications.js";
import { saveLocalUpload, storage, uploadPathFor } from "./lib/storage.js";

export function createApp() {
  const app = new Hono();

  // Request id + structured logging
  app.use("*", requestId());
  app.use("*", requestLogger);

  // Security
  app.use(
    "*",
    secureHeaders({
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
      },
    }),
  );

  // CORS — explicit allowlist only
  const allowedOrigins = env.WEB_ORIGIN.split(",");
  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin) return null;
        return allowedOrigins.includes(origin) ? origin : null;
      },
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "X-Request-ID",
        "X-CSRF-Token",
      ],
      maxAge: 86400,
    }),
  );

  // Routes
  app.route("/api", healthRoutes);
  app.route("/api/auth", authRoutes);
  app.route("/api/members", membersRoutes);
  app.route("/api/admin", adminRoutes);
  app.route("/api/photos", photosRoutes);
  app.route("/api/events", eventsRoutes);
  app.route("/api/announcements", announcementsRoutes);
  app.route("/api/documents", documentsRoutes);
  app.route("/api/shared", sharedRoutes);
  app.route("/api/posts", postsRoutes);
  app.route("/api/chat", chatRoutes);
  app.route("/api/notifications", notificationsRoutes);

  // Dev-only: local disk storage (when R2 is not configured) serves the
  // actual file bytes — mirroring the production direct-to-R2 upload, where
  // the presigned URLs themselves are the access control.
  if (!storage.isRemote) {
    app.put("/api/uploads/*", async (c) => {
      const key = c.req.path.replace(/^\/api\/uploads\//, "");
      const body = await c.req.arrayBuffer();
      await saveLocalUpload(key, body);
      return c.json({ ok: true });
    });
    app.get("/api/uploads/*", async (c) => {
      const key = c.req.path.replace(/^\/api\/uploads\//, "");
      const data = await readFile(uploadPathFor(key));
      return c.body(data, 200, { "Content-Type": "application/octet-stream" });
    });
  }

  // 404 + error handling
  app.notFound(notFound);
  app.onError(errorHandler);

  return app;
}
