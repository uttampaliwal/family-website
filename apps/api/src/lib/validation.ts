import { zValidator } from "@hono/zod-validator";
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
        result.error.issues.map((e) => ({ path: e.path.join("."), message: e.message })),
      );
    }
  });
}
