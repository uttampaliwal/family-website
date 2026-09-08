import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { Hono } from "hono";
import { env } from "../config/env.js";
import { getDbStatus, isDbHealthy } from "../lib/db.js";
import { storage } from "../lib/storage.js";

export const healthRoutes = new Hono();

const SERVICE = "family-portal-api";
const VERSION = "0.4.0";

/** R2 reachability is cached — uptime monitors must not fan out storage calls. */
const R2_CACHE_MS = 60_000;
let r2Cache: { at: number; reachable: boolean } | null = null;

async function isStorageReachable(): Promise<boolean> {
  if (!storage.isRemote) return true;
  const now = Date.now();
  if (r2Cache && now - r2Cache.at < R2_CACHE_MS) return r2Cache.reachable;
  try {
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
    });
    await client.send(new HeadBucketCommand({ Bucket: env.R2_BUCKET! }));
    r2Cache = { at: now, reachable: true };
    return true;
  } catch {
    r2Cache = { at: now, reachable: false };
    return false;
  }
}

// Liveness — always 200 while the process is up. Cheap: no dependency I/O.
healthRoutes.get("/live", (c) => {
  return c.json({
    status: "ok",
    service: SERVICE,
    version: VERSION,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Readiness — 200 only when MongoDB is reachable and (remote) storage
// answers. Point uptime monitors here.
healthRoutes.get("/ready", async (c) => {
  const [dbHealthy, storageReachable] = await Promise.all([
    isDbHealthy(),
    isStorageReachable(),
  ]);
  const ready = dbHealthy && storageReachable;
  const db = getDbStatus();
  return c.json(
    {
      status: ready ? "ready" : "degraded",
      service: SERVICE,
      version: VERSION,
      timestamp: new Date().toISOString(),
      db: { connected: db.connected, ping: dbHealthy },
      storage: { remote: storage.isRemote, reachable: storageReachable },
    },
    ready ? 200 : 503,
  );
});

// Legacy endpoint — kept for existing monitors; prefer /live + /ready.
healthRoutes.get("/health-check", async (c) => {
  const db = getDbStatus();
  const dbHealthy = await isDbHealthy();

  return c.json({
    status: "ok",
    service: SERVICE,
    version: VERSION,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    db: { connected: db.connected, ping: dbHealthy },
  });
});
