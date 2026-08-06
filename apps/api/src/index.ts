import "./lib/load-env.js";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDb, disconnectDb } from "./lib/db.js";
import { logger } from "./lib/logger.js";

async function main() {
  await connectDb();
  const app = createApp();
  const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
    logger.info(
      {
        port: info.port,
        host: info.address,
        nodeEnv: env.NODE_ENV,
      },
      "API server started",
    );
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down");
    const force = setTimeout(() => process.exit(1), 10_000);
    force.unref();
    server.close(async () => {
      await disconnectDb();
      clearTimeout(force);
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception");
    process.exit(1);
  });
  process.on("unhandledRejection", (reason) => {
    logger.fatal({ reason }, "Unhandled rejection");
    process.exit(1);
  });
}

void main().catch(async (err) => {
  logger.fatal({ err }, "Fatal startup error");
  process.exit(1);
});
