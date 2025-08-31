import mongoose from "mongoose";
import User from "../models/User";

const seedAdmin = async () => {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const mongoAppUsername = process.env.MONGO_APP_USERNAME;
  const mongoAppPassword = process.env.MONGO_APP_PASSWORD;
  const mongoHost = process.env.MONGO_HOST;
  const mongoDbName = process.env.MONGO_DB_NAME;

  if (!adminEmail) {
    console.error("Error: SEED_ADMIN_EMAIL environment variable not set.");
    process.exit(1);
  }

  if (!mongoAppUsername || !mongoAppPassword || !mongoHost || !mongoDbName) {
    console.error(
      "Error: MongoDB connection environment variables (MONGO_APP_USERNAME, MONGO_APP_PASSWORD, MONGO_HOST, MONGO_DB_NAME) are not fully set.",
    );
    process.exit(1);
  }

  const mongoUri = `mongodb://${mongoAppUsername}:${mongoAppPassword}@${mongoHost}:27017/${mongoDbName}?authSource=admin`;

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connection established.");

    const user = await User.findOne({ email: adminEmail });

    if (!user) {
      console.error(`Error: User with email "${adminEmail}" not found.`);
      process.exit(1);
    }

    user.role = "admin";
    user.adminApprovalStatus = "approved";
    user.auditLog.push({
      event: "Account promoted to Admin via seed script",
      timestamp: new Date(),
    });

    await user.save();

    console.log(
      `Successfully promoted ${user.username} (${user.email}) to Admin.`,
    );
  } catch (error) {
    console.error("An error occurred during the admin seeding process:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
    process.exit(0);
  }
};

seedAdmin();
