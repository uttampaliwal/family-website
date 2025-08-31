import express from "express";
import {
  getPendingUsers,
  approveUser,
  rejectUser,
  getAdminDashboardStats,
  getAdminActivityLogs,
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
router.get("/activity-logs", adminSessionMiddleware, getAdminActivityLogs);

// User management routes
router.get("/pending-users", adminSessionMiddleware, getPendingUsers);
router.post("/users/:userId/approve", adminSessionMiddleware, approveUser);
router.post("/users/:userId/reject", adminSessionMiddleware, rejectUser);

export default router;
