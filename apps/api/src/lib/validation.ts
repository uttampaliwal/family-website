import { zValidator } from "@hono/zod-validator";
import type { Context } from "hono";
import mongoose from "mongoose";
import type { ZodType } from "zod";
import { AppError } from "../middleware/error.js";

/** zod-validator wrapper producing the standard 422 error shape. */
export function validateBody<T extends ZodType>(schema: T) {
  return zValidator("json", schema, (result, _c) => {
    if (!result.success) {
      throw new AppError(
        422,
        "VALIDATION_ERROR",
        "Invalid request data",
        result.error.issues.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      );
    }
  });
}

/**
 * Validates a `:id` route param as a Mongo ObjectId. Without this, an
 * invalid id becomes a Mongoose CastError → 500 instead of a clean 400.
 */
export function parseObjectIdParam(c: Context, name = "id"): string {
  const value = c.req.param(name);
  if (!value || !mongoose.isValidObjectId(value)) {
    throw new AppError(400, "INVALID_ID", "Invalid identifier");
  }
  return value;
}
