import express from "express";
import {
  getGrowwStockData,
  getBseStockData,
} from "../controllers/stockController";
import { protect as authMiddleware } from "../middleware/authMiddleware";
import { apiRateLimit } from "../middleware/enhancedSecurity";

const router = express.Router();

// Stock routes are public but rate-limited.
router.use(apiRateLimit);

// Route to proxy Groww API requests
router.get("/groww", getGrowwStockData);

// Route to proxy BSE (Breeze) API requests
router.get("/bse", getBseStockData);

export default router;
