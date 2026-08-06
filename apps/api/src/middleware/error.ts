import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { logger } from "../lib/logger.js";

export class AppError extends Error {
  constructor(
    public status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 = 500,
    public code: string,
    message: string,
    public issues?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function notFound(_c: Context): Response {
  return new Response(
    JSON.stringify({ error: "NOT_FOUND", message: "Route not found" }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    },
  );
}

export async function errorHandler(
  err: unknown,
  c: Context,
): Promise<Response> {
  if (err instanceof ZodError) {
    return c.json(
      {
        error: "VALIDATION_ERROR",
        message: "Invalid request data",
        issues: err.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      },
      422,
    );
  }

  if (err instanceof HTTPException) {
    return c.json({ error: "HTTP_ERROR", message: err.message }, err.status);
  }

  if (err instanceof AppError) {
    return c.json(
      {
        error: err.code,
        message: err.message,
        ...(err.issues ? { issues: err.issues } : {}),
      },
      err.status,
    );
  }

  logger.error({ err }, "Unhandled error");
  return c.json(
    { error: "INTERNAL_ERROR", message: "Something went wrong" },
    500,
  );
}

export function requestLogger(c: Context, next: Next) {
  const start = Date.now();
  return next().then(() => {
    if (process.env.NODE_ENV !== "test") {
      logger.info(
        {
          method: c.req.method,
          path: c.req.path,
          status: c.res.status,
          durationMs: Date.now() - start,
        },
        "request completed",
      );
    }
  });
}
