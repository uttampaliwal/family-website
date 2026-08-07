/**
 * Migrates existing accounts to the expanded role model.
 *
 * The old model had `role: "user" | "admin"`. The new model is an ordered
 * hierarchy: owner > admin > parent > adult > teen > child > guest. Run once
 * after deploying the new schemas:
 *
 *   pnpm --filter @family/api migrate-roles
 */
import "../lib/load-env.js";
import { connectDb, disconnectDb } from "../lib/db.js";
import { User } from "../models/user.js";
import { logger } from "../lib/logger.js";

async function main() {
  await connectDb();

  const res = await User.updateMany({ role: "user" }, { $set: { role: "adult" } });
  logger.info(
    { n: res.modifiedCount },
    "Migrated legacy 'user' accounts to 'adult'",
  );

  const remaining = await User.countDocuments({ role: { $nin: ["user", "admin"] } });
  logger.info(
    { n: remaining },
    "Accounts not covered by the old enum (left untouched)",
  );

  await disconnectDb();
  process.exit(0);
}

void main();