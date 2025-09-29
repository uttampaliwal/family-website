import express from "express";
import {
  getPendingUsers,
  getRejectedUsers,
  approveUser,
  rejectUser,
  getAdminDashboardStats,
  getAdminActivityLogs,
  approveUserWithConfirmation,
  revokeUserAccess,
  requestAdminPromotion,
  getPendingPromotions,
  approveAdminPromotion,
  activateApprovedPromotions,
  getEnhancedDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  restoreUser,
} from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { adminApiRateLimit } from "../middleware/security.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
  adminPerformanceMiddleware,
  getPerformanceMetrics,
} from "../middleware/performanceMonitoring.js";

const router = express.Router();

// Apply authentication, admin middleware, and performance monitoring to all routes
router.use(authMiddleware);
router.use(adminMiddleware);
router.use(adminPerformanceMiddleware());

// Admin dashboard routes with session validation
router.get(
  "/dashboard/stats",
  adminApiRateLimit,
  adminPerformanceMiddleware("dashboard_stats"),
  getAdminDashboardStats,
);
router.get(
  "/dashboard/enhanced-stats",
  adminApiRateLimit,
  adminPerformanceMiddleware("enhanced_dashboard_stats"),
  getEnhancedDashboardStats,
);
router.get(
  "/activity-logs",
  adminApiRateLimit,
  adminPerformanceMiddleware("activity_logs"),
  getAdminActivityLogs,
);

// Performance monitoring endpoints
router.get("/performance/metrics", adminApiRateLimit, getPerformanceMetrics);

// User management routes
router.get("/users", adminApiRateLimit, getAllUsers);
router.get("/pending-users", adminApiRateLimit, getPendingUsers);
router.get("/rejected-users", adminApiRateLimit, getRejectedUsers);
router.post("/users/:userId/approve", adminApiRateLimit, approveUser);
router.post(
  "/users/:userId/approve-confirmed",
  adminApiRateLimit,
  approveUserWithConfirmation,
);
router.post("/users/:userId/reject", adminApiRateLimit, rejectUser);
router.post("/users/:userId/restore", adminApiRateLimit, restoreUser);
router.put("/users/:userId/role", adminApiRateLimit, updateUserRole);
router.delete("/users/:userId", adminApiRateLimit, deleteUser);
router.post(
  "/users/:userId/revoke-access",
  adminApiRateLimit,
  revokeUserAccess,
);

// Admin promotion routes
router.post(
  "/users/:userId/request-promotion",
  adminApiRateLimit,
  requestAdminPromotion,
);
router.get("/pending-promotions", adminApiRateLimit, getPendingPromotions);
router.post(
  "/promotions/:userId/approve",
  adminApiRateLimit,
  approveAdminPromotion,
);
router.post(
  "/promotions/activate",
  adminApiRateLimit,
  activateApprovedPromotions,
);

export default router;
