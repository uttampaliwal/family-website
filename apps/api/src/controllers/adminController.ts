import { Request, Response } from "express";
import User from "../models/User.js";
import { logger } from "../utils/logger.js";

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
