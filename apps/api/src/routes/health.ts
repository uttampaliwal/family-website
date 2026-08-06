import { Hono } from "hono";
import { getDbStatus, isDbHealthy } from "../lib/db.js";

export const healthRoutes = new Hono();

// Liveness — always 200 while the process is up
healthRoutes.get("/health-check", async (c) => {
  const db = getDbStatus();
  const dbHealthy = await isDbHealthy();

  return c.json({
    status: "ok",
    service: "family-portal-api",
    version: "0.3.0",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    db: { connected: db.connected, ping: dbHealthy },
  });
});
