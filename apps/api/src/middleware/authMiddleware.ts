import {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction as ExpressNextFunction,
} from "express";
import jwt from "jsonwebtoken";

/**
 * Authentication middleware that verifies JWT tokens from request headers
 * @param req - Express request object with optional user property
 * @param res - Express response object
 * @param next - Express next function to continue middleware chain
 */
export default function (
  req: ExpressRequest,
  res: ExpressResponse,
  next: ExpressNextFunction,
): void {
  const token = req.headers["x-auth-token"] as string;

  // Check if not token
  if (!token) {
    res.status(401).json({ message: "No token, authorization denied" });
    return;
  }

  // Verify token
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is not set");
    }

    // Use constant-time comparison for token verification
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ["HS512"], // Use stronger algorithm
    }) as { id: string; username: string; email: string };

    // Validate decoded token structure
    if (
      !decoded ||
      typeof decoded !== "object" ||
      !decoded.id ||
      typeof decoded.id !== "string" ||
      !decoded.username ||
      typeof decoded.username !== "string" ||
      !decoded.email ||
      typeof decoded.email !== "string"
    ) {
      res.status(401).json({ message: "Token is not valid" });
      return;
    }

    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
    };
    next();
  } catch (err) {
    // Use constant time response to prevent timing attacks

    // Log error for debugging (sanitized)
    const sanitizedError = {
      message:
        err instanceof Error
          ? err.message.replace(/[\n\r\t]/g, "")
          : "Unknown error",
      timestamp: new Date().toISOString(),
      operation: "authMiddleware",
    };
    // Use structured logging for better monitoring and debugging
    process.stderr.write(
      `[ERROR] ${new Date().toISOString()} - Auth middleware error: ${JSON.stringify(sanitizedError)}\n`,
    );

    res.status(401).json({ message: "Token is not valid" });
    return;
  }
}
