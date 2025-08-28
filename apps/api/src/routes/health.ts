import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/health", (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "UP" : "DOWN";
  const overallStatus = dbStatus === "UP" ? "UP" : "DOWN";

  res.status(overallStatus === "UP" ? 200 : 503).json({
    status: overallStatus,
    services: {
      database: dbStatus,
    },
    timestamp: new Date().toISOString(),
  });
});

router.get("/health-check", (_req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
});

export default router;
