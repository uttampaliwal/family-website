import mongoose from "mongoose";
import User from "../models/User.js";
import { logger } from "../utils/logger.js";

const seedAdmin = async () => {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const mongoAppUsername = process.env.MONGO_APP_USERNAME;
  const mongoAppPassword = process.env.MONGO_APP_PASSWORD;
  const mongoHost = process.env.MONGO_HOST;
  const mongoDbName = process.env.MONGO_DB_NAME;

  if (!adminEmail) {
    logger.error("SEED_ADMIN_EMAIL environment variable not set");
    process.exit(1);
  }

  if (!mongoAppUsername || !mongoAppPassword || !mongoHost || !mongoDbName) {
    logger.error("MongoDB connection environment variables not fully set");
    process.exit(1);
  }

  const mongoUri = `mongodb://${mongoAppUsername}:${mongoAppPassword}@${mongoHost}:27017/${mongoDbName}?authSource=admin`;

  try {
    await mongoose.connect(mongoUri);
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
