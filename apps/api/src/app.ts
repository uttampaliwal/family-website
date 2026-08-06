import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { env } from "./config/env.js";
import { errorHandler, notFound, requestLogger } from "./middleware/error.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";

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
      allowHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
      maxAge: 86400,
    }),
  );

  // Routes
  app.route("/api", healthRoutes);
  app.route("/api/auth", authRoutes);

  // 404 + error handling
  app.notFound(notFound);
  app.onError(errorHandler);

  return app;
}
