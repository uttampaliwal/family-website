import mongoose from "mongoose";
import User from "../models/User.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/environment.js";

const seedAdmin = async () => {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;

  if (!adminEmail) {
    logger.error("SEED_ADMIN_EMAIL environment variable not set");
    process.exit(1);
  }

  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info("MongoDB connection established for admin seeding");

    const user = await User.findOne({ email: adminEmail });

    if (!user) {
      logger.error("User not found for admin promotion");
      process.exit(1);
    }

    user.role = "admin";
    user.adminApprovalStatus = "approved";
    user.auditLog.push({
      event: "Account promoted to Admin via seed script",
      timestamp: new Date(),
    });

    await user.save();

    logger.info("Successfully promoted user to Admin");
  } catch (error) {
    logger.error(`Error during admin seeding process: ${String(error)}`);
  } finally {
    await mongoose.disconnect();
    logger.info("MongoDB connection closed after admin seeding");
    process.exit(0);
  }
};

seedAdmin();
