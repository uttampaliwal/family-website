/**
 * Promotes the user with ADMIN_EMAIL (if set) to owner, or creates a
 * fresh owner from CLI arguments: pnpm --filter @family/api seed-admin
 * -- email password
 */
import "../lib/load-env.js";
import { connectDb, disconnectDb } from "../lib/db.js";
import { hashPassword } from "../lib/passwords.js";
import { User } from "../models/user.js";
import { logger } from "../lib/logger.js";

async function main() {
  const [emailArg, passwordArg] = process.argv.slice(2);

  const email = (process.env.ADMIN_EMAIL ?? emailArg)?.toLowerCase();
  const password = passwordArg ?? process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    logger.error(
      "Usage: ADMIN_EMAIL=x ADMIN_PASSWORD=y pnpm --filter @family/api seed-admin (or pass email password as args)",
    );
    process.exit(1);
  }

  await connectDb();

  let user = await User.findOne({ email });
  if (user) {
    user.role = "owner";
    user.adminApprovalStatus = "approved";
    user.isVerified = true;
    await user.save();
    logger.info({ email }, "Existing user promoted to owner");
  } else {
    user = await User.create({
      name: "Administrator",
      email,
      username: email.split("@")[0]!.slice(0, 30),
      passwordHash: await hashPassword(password),
      dateOfBirth: new Date("1990-01-01"),
      gender: "prefer_not",
      role: "owner",
      isVerified: true,
      adminApprovalStatus: "approved",
    });
    logger.info({ email }, "Owner user created");
  }

  await disconnectDb();
  process.exit(0);
}

void main();