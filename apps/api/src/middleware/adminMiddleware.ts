import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";
import User from "../models/User.js";

/**
 * Enhanced admin middleware with comprehensive security and logging
 */
export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Ensure user is authenticated first
    if (!req.user) {
      logger.warn(
        {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          path: req.path,
          method: req.method,
          operation: "admin_access_denied_no_auth",
        },
        "Admin access denied: No authentication",
      );

      res.status(401).json({
        message: "Authentication required",
        code: "AUTH_REQUIRED",
      });
      return;
    }

    // Check if user has admin role
    if (req.user.role !== "admin") {
      // Log unauthorized admin access attempt
      logger.warn(
        {
          userId: req.user._id,
          username: req.user.username,
          role: req.user.role,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          path: req.path,
          method: req.method,
          operation: "admin_access_denied_insufficient_privileges",
        },
        "Admin access denied: Insufficient privileges",
      );

      // Add to user's audit log
      try {
        await User.findByIdAndUpdate(req.user._id, {
          $push: {
            auditLog: {
              event: "Unauthorized admin access attempt",
              timestamp: new Date(),
              details: `Attempted to access ${req.method} ${req.path}`,
            },
          },
        });
      } catch (auditError) {
        logger.error(
          {
            err: auditError,
            userId: req.user._id,
            operation: "audit_log_update_failed",
          },
          "Failed to update user audit log",
        );
      }

      res.status(403).json({
        message: "Forbidden: Admin privileges required",
        code: "INSUFFICIENT_PRIVILEGES",
      });
      return;
    }

    // Verify admin account is approved and active
    if (req.user.adminApprovalStatus !== "approved") {
      logger.warn(
        {
          userId: req.user._id,
          username: req.user.username,
          adminApprovalStatus: req.user.adminApprovalStatus,
          ip: req.ip,
          operation: "admin_access_denied_not_approved",
        },
        "Admin access denied: Account not approved",
      );

      res.status(403).json({
        message: "Admin account not approved",
        code: "ADMIN_NOT_APPROVED",
      });
      return;
    }

    // Log successful admin access
    logger.info(
      {
        userId: req.user._id,
        username: req.user.username,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
        method: req.method,
        operation: "admin_access_granted",
      },
      "Admin access granted",
    );

    // Add admin activity to audit log
    try {
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          auditLog: {
            event: "Admin dashboard access",
            timestamp: new Date(),
            details: `Accessed ${req.method} ${req.path} from IP ${req.ip}`,
          },
        },
      });
    } catch (auditError) {
      logger.error(
        {
          err: auditError,
          userId: req.user._id,
          operation: "admin_audit_log_failed",
        },
        "Failed to log admin activity",
      );
      // Don't fail the request if audit logging fails
    }

    next();
  } catch (error) {
    logger.error(
      {
        err: error,
        userId: req.user?._id,
        ip: req.ip,
        path: req.path,
        method: req.method,
        operation: "admin_middleware_error",
      },
      "Admin middleware error",
    );

    res.status(500).json({
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    });
    return;
  }
};

/**
 * Session validation middleware for admin routes
 */
export const adminSessionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Session expired",
        code: "SESSION_EXPIRED",
      });
      return;
    }

    // Refresh user data to ensure current privileges
    const currentUser = await User.findById(req.user._id).select(
      "-password -refreshTokens",
    );

    if (!currentUser) {
      logger.warn(
        {
          userId: req.user._id,
          operation: "admin_session_user_not_found",
        },
        "Admin session validation failed: User not found",
      );

      res.status(401).json({
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
      return;
    }

    // Check if admin privileges were revoked
    if (
      currentUser.role !== "admin" ||
      currentUser.adminApprovalStatus !== "approved"
    ) {
      logger.warn(
        {
          userId: currentUser._id,
          username: currentUser.username,
          role: currentUser.role,
          adminApprovalStatus: currentUser.adminApprovalStatus,
          operation: "admin_privileges_revoked",
        },
        "Admin privileges revoked during session",
      );

      res.status(403).json({
        message: "Admin privileges revoked",
        code: "PRIVILEGES_REVOKED",
      });
      return;
    }

    // Update request with fresh user data
    req.user = currentUser;
    next();
  } catch (error) {
    logger.error(
      {
        err: error,
        userId: req.user?._id,
        operation: "admin_session_validation_error",
      },
      "Admin session validation error",
    );

    res.status(500).json({
      message: "Session validation failed",
      code: "SESSION_VALIDATION_ERROR",
    });
    return;
  }
};

export { adminMiddleware as default };
