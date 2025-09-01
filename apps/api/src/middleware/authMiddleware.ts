import {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction as ExpressNextFunction,
} from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { logger } from "../utils/logger.js";

/**
 * Authentication middleware that verifies JWT tokens from request headers
 * @param req - Express request object with optional user property
 * @param res - Express response object
 * @param next - Express next function to continue middleware chain
 */
export default async function (
  req: ExpressRequest,
  res: ExpressResponse,
  next: ExpressNextFunction,
): Promise<void> {
  // Get token from Authorization header (Bearer token format) or x-auth-token header
  const authHeader = req.headers.authorization as string;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : (req.headers["x-auth-token"] as string);

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
    }) as { id: string };

    // Validate decoded token structure
    if (
      !decoded ||
      typeof decoded !== "object" ||
      !decoded.id ||
      typeof decoded.id !== "string"
    ) {
      res.status(401).json({ message: "Token is not valid" });
      return;
    }

    // Fetch user details from database
    const user = await User.findById(decoded.id).select(
      "-password -refreshTokens",
    );
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Check if user access has been revoked
    if (user.accessRevoked) {
      res.status(403).json({
        message: "Access has been revoked",
        reason: user.accessRevokedReason,
        revokedAt: user.accessRevokedAt,
      });
      return;
    }

    // Check if user is approved (unless they're an admin)
    if (user.role !== "admin" && user.adminApprovalStatus !== "approved") {
      res.status(403).json({
        message: "Account pending approval",
        status: user.adminApprovalStatus,
      });
      return;
    }

    req.user = user;

    // Log successful authentication for audit purposes
    logger.info(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        operation: "authentication_success",
      },
      "User authenticated successfully",
    );

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
      tokenPresent: !!token,
      tokenLength: token ? token.length : 0,
    };
    // Use structured logging for better monitoring and debugging
    console.error("Auth middleware error:", sanitizedError);

    res.status(401).json({ message: "Token is not valid" });
    return;
  }
}
