import { Request, Response } from "express";
import User from "../models/User.js";
import AdminAction from "../models/AdminAction.js";
import { logger } from "../utils/logger.js";
import { sendEnhancedEmail } from "../utils/enhancedEmailService.js";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    logger.info(
      {
        adminId: req.user?._id,
        adminUsername: req.user?.username,
        ip: req.ip,
        operation: "get_all_users",
      },
      "Admin fetching all users",
    );

    const users = await User.find({}).select(
      "username email role createdAt isVerified adminApprovalStatus accessRevoked",
    );

    logger.info(
      {
        adminId: req.user?._id,
        retrievedUsersCount: users.length,
        operation: "get_all_users_success",
      },
      "All users retrieved successfully",
    );

    return res.status(200).json(users);
  } catch (error) {
    logger.error(
      {
        err: error,
        adminId: req.user?._id,
        operation: "get_all_users_error",
      },
      "Error fetching all users",
    );

    return res.status(500).json({ message: "Error fetching all users", error });
  }
};

export const getPendingUsers = async (req: Request, res: Response) => {
  try {
    logger.info(
      {
        adminId: req.user?._id,
        adminUsername: req.user?.username,
        ip: req.ip,
        operation: "get_pending_users",
      },
      "Admin fetching pending users",
    );

    const users = await User.find({ adminApprovalStatus: "pending" }).select(
      "-password -refreshTokens",
    );

    logger.info(
      {
        adminId: req.user?._id,
        pendingUsersCount: users.length,
        operation: "get_pending_users_success",
      },
      "Pending users retrieved successfully",
    );

    return res.status(200).json(users);
  } catch (error) {
    logger.error(
      {
        err: error,
        adminId: req.user?._id,
        operation: "get_pending_users_error",
      },
      "Error fetching pending users",
    );

    return res
      .status(500)
      .json({ message: "Error fetching pending users", error });
  }
};

export const getRejectedUsers = async (req: Request, res: Response) => {
  try {
    logger.info(
      {
        adminId: req.user?._id,
        adminUsername: req.user?.username,
        ip: req.ip,
        operation: "get_rejected_users",
      },
      "Admin fetching rejected users",
    );

    const users = await User.find({ adminApprovalStatus: "rejected" }).select(
      "-password -refreshTokens",
    );

    logger.info(
      {
        adminId: req.user?._id,
        rejectedUsersCount: users.length,
        operation: "get_rejected_users_success",
      },
      "Rejected users retrieved successfully",
    );

    return res.status(200).json(users);
  } catch (error) {
    logger.error(
      {
        err: error,
        adminId: req.user?._id,
        operation: "get_rejected_users_error",
      },
      "Error fetching rejected users",
    );

    return res
      .status(500)
      .json({ message: "Error fetching rejected users", error });
  }
};

export const approveUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    logger.info(
      {
        adminId: req.user?._id,
        adminUsername: req.user?.username,
        targetUserId: userId,
        ip: req.ip,
        operation: "approve_user_attempt",
      },
      "Admin attempting to approve user",
    );

    const user = await User.findById(userId);
    if (!user) {
      logger.warn(
        {
          adminId: req.user?._id,
          targetUserId: userId,
          operation: "approve_user_not_found",
        },
        "User not found for approval",
      );

      return res.status(404).json({ message: "User not found" });
    }

    const previousStatus = user.adminApprovalStatus;
    user.adminApprovalStatus = "approved";
    user.auditLog.push({
      event: "Admin approved account",
      timestamp: new Date(),
      details: `Approved by admin ${req.user?.username} (${req.user?._id}) from IP ${req.ip}`,
    });
    await user.save();

    // Log admin action
    logger.info(
      {
        adminId: req.user?._id,
        adminUsername: req.user?.username,
        targetUserId: userId,
        targetUsername: user.username,
        previousStatus,
        newStatus: "approved",
        ip: req.ip,
        operation: "user_approved_success",
      },
      "User approved successfully",
    );

    // Add to admin's audit log
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          auditLog: {
            event: "User approval action",
            timestamp: new Date(),
            details: `Approved user ${user.username} (${userId})`,
          },
        },
      });
    }

    return res.status(200).json({
      message: "User approved successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        status: user.adminApprovalStatus,
      },
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        adminId: req.user?._id,
        targetUserId: userId,
        operation: "approve_user_error",
      },
      "Error approving user",
    );

    return res.status(500).json({ message: "Error approving user", error });
  }
};

export const rejectUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { reason } = req.body;

  try {
    logger.info(
      {
        adminId: req.user?._id,
        adminUsername: req.user?.username,
        targetUserId: userId,
        reason,
        ip: req.ip,
        operation: "reject_user_attempt",
      },
      "Admin attempting to reject user",
    );

    const user = await User.findById(userId);
    if (!user) {
      logger.warn(
        {
          adminId: req.user?._id,
          targetUserId: userId,
          operation: "reject_user_not_found",
        },
        "User not found for rejection",
      );

      return res.status(404).json({ message: "User not found" });
    }

    const previousStatus = user.adminApprovalStatus;
    user.adminApprovalStatus = "rejected";
    user.auditLog.push({
      event: "Admin rejected account",
      timestamp: new Date(),
      details: `Rejected by admin ${req.user?.username} (${req.user?._id}) from IP ${req.ip}. Reason: ${reason || "No reason provided"}`,
    });
    await user.save();

    // Log admin action
    logger.info(
      {
        adminId: req.user?._id,
        adminUsername: req.user?.username,
        targetUserId: userId,
        targetUsername: user.username,
        previousStatus,
        newStatus: "rejected",
        reason,
        ip: req.ip,
        operation: "user_rejected_success",
      },
      "User rejected successfully",
    );

    // Add to admin's audit log
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          auditLog: {
            event: "User rejection action",
            timestamp: new Date(),
            details: `Rejected user ${user.username} (${userId}). Reason: ${reason || "No reason provided"}`,
          },
        },
      });
    }

    return res.status(200).json({
      message: "User rejected successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        status: user.adminApprovalStatus,
      },
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        adminId: req.user?._id,
        targetUserId: userId,
        operation: "reject_user_error",
      },
      "Error rejecting user",
    );

    return res.status(500).json({ message: "Error rejecting user", error });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role } = req.body;

  try {
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent demoting a super admin
    if (userToUpdate.isSuperAdmin) {
      return res
        .status(403)
        .json({ message: "Cannot change the role of a super admin." });
    }

    // Prevent last admin from being demoted
    if (userToUpdate.role === "admin" && role === "user") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res
          .status(400)
          .json({ message: "Cannot remove the last admin." });
      }
    }

    userToUpdate.role = role;
    await userToUpdate.save();

    return res.status(200).json({ message: "User role updated successfully." });
  } catch (error) {
    logger.error({ err: error }, "Error updating user role");
    return res.status(500).json({ message: "Error updating user role", error });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deleting a super admin
    if (userToDelete.isSuperAdmin) {
      return res.status(403).json({ message: "Cannot delete a super admin." });
    }

    // Prevent deleting the last admin
    if (userToDelete.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res
          .status(400)
          .json({ message: "Cannot delete the last admin." });
      }
    }

    await User.findByIdAndDelete(userId);

    return res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    logger.error({ err: error }, "Error deleting user");
    return res.status(500).json({ message: "Error deleting user", error });
  }
};

// New admin dashboard analytics endpoint
export const getAdminDashboardStats = async (req: Request, res: Response) => {
  try {
    logger.info(
      {
        adminId: req.user?._id,
        adminUsername: req.user?.username,
        ip: req.ip,
        operation: "get_admin_dashboard_stats",
      },
      "Admin fetching dashboard statistics",
    );

    const [
      totalUsers,
      pendingUsers,
      approvedUsers,
      rejectedUsers,
      adminUsers,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ adminApprovalStatus: "pending" }),
      User.countDocuments({ adminApprovalStatus: "approved" }),
      User.countDocuments({ adminApprovalStatus: "rejected" }),
      User.countDocuments({ role: "admin" }),
      User.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("-password -refreshTokens"),
    ]);

    const stats = {
      totalUsers,
      pendingUsers,
      approvedUsers,
      rejectedUsers,
      adminUsers,
      recentUsers,
      lastUpdated: new Date(),
    };

    logger.info(
      {
        adminId: req.user?._id,
        stats: {
          totalUsers,
          pendingUsers,
          approvedUsers,
          rejectedUsers,
          adminUsers,
        },
        operation: "admin_dashboard_stats_success",
      },
      "Admin dashboard statistics retrieved",
    );

    return res.status(200).json(stats);
  } catch (error) {
    logger.error(
      {
        err: error,
        adminId: req.user?._id,
        operation: "get_admin_dashboard_stats_error",
      },
      "Error fetching admin dashboard statistics",
    );

    return res.status(500).json({
      message: "Error fetching dashboard statistics",
      error,
    });
  }
};

// Get admin activity logs
export const getAdminActivityLogs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    logger.info(
      {
        adminId: req.user?._id,
        adminUsername: req.user?.username,
        page,
        limit,
        operation: "get_admin_activity_logs",
      },
      "Admin fetching activity logs",
    );

    const adminUsers = await User.find({ role: "admin" })
      .select("username auditLog")
      .sort({ "auditLog.timestamp": -1 });

    // Flatten and sort all admin activities
    const allActivities = adminUsers
      .flatMap((admin) =>
        admin.auditLog.map((log, logIndex) => ({
          _id: `${admin._id}_${logIndex}_${log.timestamp}`,
          event: log.event,
          timestamp: log.timestamp,
          details: log.details,
          adminId: admin._id,
          adminUsername: admin.username,
        })),
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(skip, skip + Number(limit));

    const totalActivities = adminUsers.reduce(
      (total, admin) => total + admin.auditLog.length,
      0,
    );

    return res.status(200).json({
      activities: allActivities,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalActivities / Number(limit)),
        totalActivities,
        hasNext: skip + Number(limit) < totalActivities,
        hasPrev: Number(page) > 1,
      },
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        adminId: req.user?._id,
        operation: "get_admin_activity_logs_error",
      },
      "Error fetching admin activity logs",
    );

    return res.status(500).json({
      message: "Error fetching activity logs",
      error,
    });
  }
};

// Enhanced admin functions with dual confirmation
export const approveUserWithConfirmation = async (
  req: Request,
  res: Response,
) => {
  const { userId } = req.params;
  const { confirmation } = req.body;

  try {
    if (!confirmation || confirmation !== "CONFIRM_APPROVE") {
      return res.status(400).json({
        message:
          "Confirmation required. Please type 'CONFIRM_APPROVE' to proceed.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.adminApprovalStatus === "approved") {
      return res.status(400).json({ message: "User is already approved" });
    }

    const previousStatus = user.adminApprovalStatus;
    user.adminApprovalStatus = "approved";
    user.auditLog.push({
      event: "Admin approved account with confirmation",
      timestamp: new Date(),
      details: `Approved by admin ${req.user?.username} (${req.user?._id}) from IP ${req.ip}`,
      adminId: req.user?._id.toString(),
      ip: req.ip,
    });
    await user.save();

    // Log admin action
    await AdminAction.create({
      adminId: req.user?._id,
      action: "user_approve",
      targetType: "user",
      targetId: userId,
      details: {
        description: `User ${user.username} approved with dual confirmation`,
        previousState: { status: previousStatus },
        newState: { status: "approved" },
        confirmationRequired: true,
        confirmedBy: [req.user?._id],
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      },
      severity: "medium",
    });

    // Send approval email
    try {
      await sendEnhancedEmail({
        to: user.email,
        subject: "Account Approved - Welcome to Family Portal",
        html: `
          <h2>Welcome to Family Portal!</h2>
          <p>Dear ${user.name},</p>
          <p>Your account has been approved and you now have full access to the Family Portal.</p>
          <p>You can now log in and start connecting with your family members.</p>
          <p>Best regards,<br>The Family Portal Team</p>
        `,
      });
    } catch (emailError) {
      logger.warn({ err: emailError }, "Failed to send approval email");
    }

    logger.info(
      {
        adminId: req.user?._id,
        targetUserId: userId,
        action: "user_approved_with_confirmation",
      },
      "User approved with dual confirmation",
    );

    return res.status(200).json({
      message: "User approved successfully with confirmation",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        status: user.adminApprovalStatus,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error approving user with confirmation");
    return res.status(500).json({ message: "Error approving user", error });
  }
};

// Revoke user access instantly
export const revokeUserAccess = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { reason, confirmation } = req.body;

  try {
    if (!confirmation || confirmation !== "CONFIRM_REVOKE") {
      return res.status(400).json({
        message:
          "Confirmation required. Please type 'CONFIRM_REVOKE' to proceed.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        message: "Cannot revoke access for admin users. Please demote first.",
      });
    }

    user.accessRevoked = true;
    user.accessRevokedAt = new Date();
    user.accessRevokedBy = req.user?._id;
    user.accessRevokedReason = reason;
    user.refreshTokens = []; // Clear all refresh tokens
    user.sessionTokens = []; // Clear all session tokens
    user.auditLog.push({
      event: "Access revoked by admin",
      timestamp: new Date(),
      details: `Access revoked by admin ${req.user?.username}. Reason: ${reason}`,
      adminId: req.user?._id.toString(),
      ip: req.ip,
    });
    await user.save();

    // Log admin action
    await AdminAction.create({
      adminId: req.user?._id,
      action: "user_revoke_access",
      targetType: "user",
      targetId: userId,
      details: {
        description: `Access revoked for user ${user.username}`,
        reason,
        confirmationRequired: true,
        confirmedBy: [req.user?._id],
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      },
      severity: "high",
    });

    // Send notification email
    try {
      await sendEnhancedEmail({
        to: user.email,
        subject: "Account Access Revoked - Family Portal",
        html: `
          <h2>Account Access Revoked</h2>
          <p>Dear ${user.name},</p>
          <p>Your access to the Family Portal has been revoked.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>If you believe this is an error, please contact support.</p>
          <p>Best regards,<br>The Family Portal Team</p>
        `,
      });
    } catch (emailError) {
      logger.warn({ err: emailError }, "Failed to send revocation email");
    }

    return res.status(200).json({
      message: "User access revoked successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        accessRevoked: true,
        revokedAt: user.accessRevokedAt,
        reason,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error revoking user access");
    return res
      .status(500)
      .json({ message: "Error revoking user access", error });
  }
};

// Request admin promotion for verified user
export const requestAdminPromotion = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { reason } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        message: "User must be verified before admin promotion",
      });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "User is already an admin" });
    }

    if (user.adminPromotion?.status === "pending") {
      return res.status(400).json({
        message: "Admin promotion request already pending",
      });
    }

    const activationDate = new Date();
    activationDate.setDate(activationDate.getDate() + 7); // 7 days from now

    user.adminPromotion = {
      status: "pending",
      requestedBy: req.user!._id,
      requestedAt: new Date(),
      activationDate,
      approvedBy: [],
      reason,
    };

    user.auditLog.push({
      event: "Admin promotion requested",
      timestamp: new Date(),
      details: `Promotion requested by admin ${req.user?.username}. Activation scheduled for ${activationDate.toISOString()}`,
      adminId: req.user?._id.toString(),
      ip: req.ip,
    });
    await user.save();

    // Log admin action
    await AdminAction.create({
      adminId: req.user?._id,
      action: "admin_promotion_request",
      targetType: "promotion",
      targetId: userId,
      details: {
        description: `Admin promotion requested for user ${user.username}`,
        reason,
        newState: {
          status: "pending",
          activationDate: activationDate.toISOString(),
        },
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      },
      severity: "high",
    });

    return res.status(200).json({
      message: "Admin promotion requested successfully",
      promotion: {
        status: "pending",
        activationDate,
        reason,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error requesting admin promotion");
    return res
      .status(500)
      .json({ message: "Error requesting admin promotion", error });
  }
};

// Get pending admin promotions
export const getPendingPromotions = async (req: Request, res: Response) => {
  try {
    const pendingPromotions = await User.find({
      "adminPromotion.status": "pending",
    })
      .select("username email adminPromotion")
      .populate("adminPromotion.requestedBy", "username");

    return res.status(200).json(pendingPromotions);
  } catch (error) {
    logger.error({ err: error }, "Error fetching pending promotions");
    return res
      .status(500)
      .json({ message: "Error fetching pending promotions", error });
  }
};

// Approve admin promotion (requires dual confirmation)
export const approveAdminPromotion = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { confirmation } = req.body;

  try {
    if (!confirmation || confirmation !== "CONFIRM_PROMOTE") {
      return res.status(400).json({
        message:
          "Confirmation required. Please type 'CONFIRM_PROMOTE' to proceed.",
      });
    }

    const user = await User.findById(userId);
    if (
      !user ||
      !user.adminPromotion ||
      user.adminPromotion.status !== "pending"
    ) {
      return res.status(404).json({ message: "No pending promotion found" });
    }

    // Check if admin already approved
    const alreadyApproved = user.adminPromotion.approvedBy?.some(
      (adminId) => adminId.toString() === req.user?._id.toString(),
    );

    if (alreadyApproved) {
      return res
        .status(400)
        .json({ message: "You have already approved this promotion" });
    }

    user.adminPromotion.approvedBy = user.adminPromotion.approvedBy || [];
    user.adminPromotion.approvedBy!.push(req.user!._id);

    // Check if we have enough approvals (require 2 admin approvals)
    if (user.adminPromotion.approvedBy.length >= 2) {
      user.adminPromotion.status = "approved";
    }

    user.auditLog.push({
      event: "Admin promotion approved",
      timestamp: new Date(),
      details: `Approved by admin ${req.user?.username}. Total approvals: ${user.adminPromotion.approvedBy.length}/2`,
      adminId: req.user?._id.toString(),
      ip: req.ip,
    });
    await user.save();

    // Log admin action
    await AdminAction.create({
      adminId: req.user?._id,
      action: "admin_promotion_approve",
      targetType: "promotion",
      targetId: userId,
      details: {
        description: `Admin promotion approved for user ${user.username}`,
        confirmationRequired: true,
        confirmedBy: [req.user?._id],
        newState: {
          status: user.adminPromotion.status,
          approvals: user.adminPromotion.approvedBy.length,
        },
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      },
      severity: "high",
    });

    return res.status(200).json({
      message: "Admin promotion approved",
      promotion: {
        status: user.adminPromotion.status,
        approvals: user.adminPromotion.approvedBy.length,
        activationDate: user.adminPromotion.activationDate,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error approving admin promotion");
    return res
      .status(500)
      .json({ message: "Error approving admin promotion", error });
  }
};

// Activate approved promotions (scheduled job or manual trigger)
export const activateApprovedPromotions = async (
  req: Request,
  res: Response,
) => {
  try {
    const now = new Date();
    const promotionsToActivate = await User.find({
      "adminPromotion.status": "approved",
      "adminPromotion.activationDate": { $lte: now },
    });

    const results = [];
    for (const user of promotionsToActivate) {
      user.role = "admin";
      user.adminPromotion!.status = "none";
      user.auditLog.push({
        event: "Admin promotion activated",
        timestamp: new Date(),
        details: "Promotion automatically activated after 7-day period",
      });
      await user.save();

      // Log admin action
      await AdminAction.create({
        adminId: req.user?._id || user.adminPromotion!.requestedBy,
        action: "admin_promotion_activate",
        targetType: "promotion",
        targetId: user._id,
        details: {
          description: `Admin promotion activated for user ${user.username}`,
          newState: { role: "admin" },
        },
        severity: "critical",
      });

      results.push({
        userId: user._id,
        username: user.username,
        promoted: true,
      });
    }

    return res.status(200).json({
      message: `${results.length} promotions activated`,
      results,
    });
  } catch (error) {
    logger.error({ err: error }, "Error activating promotions");
    return res
      .status(500)
      .json({ message: "Error activating promotions", error });
  }
};

// Get comprehensive admin dashboard stats
export const getEnhancedDashboardStats = async (
  req: Request,
  res: Response,
) => {
  try {
    const [
      totalUsers,
      pendingUsers,
      approvedUsers,
      rejectedUsers,
      adminUsers,
      revokedUsers,
      pendingPromotions,
      recentActions,
      criticalActions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ adminApprovalStatus: "pending" }),
      User.countDocuments({ adminApprovalStatus: "approved" }),
      User.countDocuments({ adminApprovalStatus: "rejected" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ accessRevoked: true }),
      User.countDocuments({ "adminPromotion.status": "pending" }),
      AdminAction.find()
        .sort({ timestamp: -1 })
        .limit(10)
        .populate("adminId", "username"),
      AdminAction.countDocuments({
        severity: "critical",
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ]);

    const stats = {
      totalUsers,
      pendingUsers,
      approvedUsers,
      rejectedUsers,
      adminUsers,
      revokedUsers,
      pendingPromotions,
      recentActions,
      criticalActions,
      lastUpdated: new Date(),
    };

    return res.status(200).json(stats);
  } catch (error) {
    logger.error({ err: error }, "Error fetching enhanced dashboard stats");
    return res
      .status(500)
      .json({ message: "Error fetching dashboard stats", error });
  }
};
