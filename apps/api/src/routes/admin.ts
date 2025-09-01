import express from "express";
import {
  getPendingUsers,
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
} from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware, {
  adminSessionMiddleware,
} from "../middleware/adminMiddleware.js";

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Admin dashboard routes with session validation
router.get("/dashboard/stats", adminSessionMiddleware, getAdminDashboardStats);
router.get(
  "/dashboard/enhanced-stats",
  adminSessionMiddleware,
  getEnhancedDashboardStats,
);
router.get("/activity-logs", adminSessionMiddleware, getAdminActivityLogs);

// User management routes
router.get("/pending-users", adminSessionMiddleware, getPendingUsers);
router.post("/users/:userId/approve", adminSessionMiddleware, approveUser);
router.post(
  "/users/:userId/approve-confirmed",
  adminSessionMiddleware,
  approveUserWithConfirmation,
);
router.post("/users/:userId/reject", adminSessionMiddleware, rejectUser);
router.post(
  "/users/:userId/revoke-access",
  adminSessionMiddleware,
  revokeUserAccess,
);

// Admin promotion routes
router.post(
  "/users/:userId/request-promotion",
  adminSessionMiddleware,
  requestAdminPromotion,
);
router.get("/pending-promotions", adminSessionMiddleware, getPendingPromotions);
router.post(
  "/promotions/:userId/approve",
  adminSessionMiddleware,
  approveAdminPromotion,
);
router.post(
  "/promotions/activate",
  adminSessionMiddleware,
  activateApprovedPromotions,
);

export default router;
