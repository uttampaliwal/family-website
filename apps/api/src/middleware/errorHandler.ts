import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { isHttpError } from "http-errors";
import { sanitizeLog } from "../utils/logSanitizer.js";
import { logError } from "../utils/logger.js";

/**
 * A custom error interface to ensure statusCode is available.
 * This is optional but good practice.
 */
export const errorHandler = (
  err: Error,
  req: ExpressRequest,
  res: ExpressResponse,
) => {
  // In development, or for non-http errors, log the full error
  if (process.env.NODE_ENV !== "production" || !isHttpError(err)) {
    // Use structured logging with appropriate log level
    logError(err, "error_handler", {
      url: sanitizeLog(String(req.url || "")),
      method: sanitizeLog(String(req.method || "")),
      userAgent: sanitizeLog(req.get("User-Agent") || "Unknown"),
    });
  }

  // If it's an HttpError from the http-errors package, use its properties
  // Otherwise, default to 500 Internal Server Error
  const statusCode = isHttpError(err) ? err.statusCode : 500;
  const message = isHttpError(err) ? err.message : "Internal Server Error";

  // Don't leak stack trace in production for client-facing errors
  const errorResponse: { message: string; stack?: string } = {
    message: String(message).replace(/[<>"'&]/g, ""),
  };

  // Add stack trace in development mode
  if (process.env.NODE_ENV !== "production" && err.stack) {
    errorResponse.stack = err.stack.replace(/[\n\r\t]/g, " ");
  }

  // Ensure response hasn't been sent already
  if (!res.headersSent) {
    try {
      res.status(statusCode).json(errorResponse);
    } catch (responseError) {
      // Log response error
      logError(responseError as Error, "response_error", {
        message: "Failed to send JSON error response",
      });

      // Fallback: send a basic text response
      try {
        res.status(500).send("Internal Server Error");
      } catch (fallbackError) {
        // Log fallback error
        logError(fallbackError as Error, "fallback_response_error", {
          message: "Failed to send fallback error response",
        });

        // Last resort: end the response
        try {
          res.end();
        } catch (endError) {
          logError(endError as Error, "fatal_response_error", {
            level: "FATAL",
            message: "Failed to end response",
          });
        }
      }
    }
  }
};
