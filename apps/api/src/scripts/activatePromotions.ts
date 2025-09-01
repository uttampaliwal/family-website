import mongoose from "mongoose";
import User from "../models/User.js";
import AdminAction from "../models/AdminAction.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/environment.js";

/**
 * Scheduled job to activate approved admin promotions after 7-day waiting period
 * This script should be run daily via cron job or similar scheduler
 */
async function activatePromotions() {
  try {
    // Connect to database
    await mongoose.connect(env.MONGO_URI);
    logger.info("Connected to MongoDB for promotion activation");

    const now = new Date();

    // Find all promotions that are approved and ready for activation
    const promotionsToActivate = await User.find({
      "adminPromotion.status": "approved",
      "adminPromotion.activationDate": { $lte: now },
    });

    logger.info(
      `Found ${promotionsToActivate.length} promotions ready for activation`,
    );

    let activatedCount = 0;
    let failedCount = 0;

    for (const user of promotionsToActivate) {
      try {
        const previousRole = user.role;
        const promotionDetails = user.adminPromotion;

        // Activate the promotion
        user.role = "admin";
        user.adminPromotion!.status = "none";
        user.auditLog.push({
          event: "Admin promotion activated automatically",
          timestamp: new Date(),
          details: `Promotion automatically activated after 7-day waiting period. Originally requested by admin ID: ${promotionDetails?.requestedBy}`,
        });

        await user.save();

        // Log the activation
        await AdminAction.create({
          adminId: promotionDetails?.requestedBy || user._id,
          action: "admin_promotion_activate",
          targetType: "promotion",
          targetId: user._id,
          details: {
            description: `Admin promotion automatically activated for user ${user.username}`,
            previousState: { role: previousRole },
            newState: { role: "admin" },
            reason: "7-day waiting period completed",
          },
          severity: "critical",
          metadata: {
            automated: true,
            originalRequestDate: promotionDetails?.requestedAt,
            activationDate: now,
          },
        });

        activatedCount++;
        logger.info(
          {
            userId: user._id,
            username: user.username,
            previousRole,
            newRole: "admin",
          },
          "Admin promotion activated successfully",
        );
      } catch (error) {
        failedCount++;
        logger.error(
          {
            err: error,
            userId: user._id,
            username: user.username,
          },
          "Failed to activate admin promotion",
        );
      }
    }

    logger.info(
      {
        totalFound: promotionsToActivate.length,
        activated: activatedCount,
        failed: failedCount,
      },
      "Promotion activation job completed",
    );

    // Close database connection
    await mongoose.connection.close();
    logger.info("Database connection closed");

    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "Fatal error in promotion activation job");
    process.exit(1);
  }
}

// Run the activation job
activatePromotions();
