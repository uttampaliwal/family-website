import express from "express";
import {
  getCurrentPolicy,
  getPolicyHistory,
  createPolicyVersion,
  updatePolicyVersion,
  getAllCurrentPolicies,
} from "../controllers/policyController.js";
import { protect as authMiddleware } from "../middleware/authMiddleware";
import adminMiddleware, {
  adminSessionMiddleware,
} from "../middleware/adminMiddleware.js";

const router = express.Router();

// Public routes (no auth required)
router.get("/current/:type", getCurrentPolicy);
router.get("/all-current", getAllCurrentPolicies);

// Admin-only routes
router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/history/:type", adminSessionMiddleware, getPolicyHistory);
router.post("/create", adminSessionMiddleware, createPolicyVersion);
router.put("/:policyId", adminSessionMiddleware, updatePolicyVersion);

export default router;
