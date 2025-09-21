import mongoose from "mongoose";
import { logInfo, logError } from "./logger";

/**
 * Creates database indexes for improved query performance
 * Run this during application startup or as a migration
 */
export const createDatabaseIndexes = async (): Promise<void> => {
  try {
    logInfo("Creating database indexes for performance optimization");

    // User model indexes
    const UserModel = mongoose.model("User");
    await UserModel.collection.createIndex({ email: 1 }, { unique: true });
    await UserModel.collection.createIndex({ username: 1 }, { unique: true });
    await UserModel.collection.createIndex({ emailVerified: 1 });
    await UserModel.collection.createIndex({ role: 1 });
    await UserModel.collection.createIndex({ createdAt: -1 });

    // UserData model indexes
    const UserDataModel = mongoose.model("UserData");
    await UserDataModel.collection.createIndex({ userId: 1 }, { unique: true });
    await UserDataModel.collection.createIndex({ "events.date": -1 });
    await UserDataModel.collection.createIndex({ "tasks.completed": 1 });
    await UserDataModel.collection.createIndex({ "tasks.dueDate": 1 });
    await UserDataModel.collection.createIndex({ "photos.uploadDate": -1 });

    // Document model indexes
    const DocumentModel = mongoose.model("Document");
    await DocumentModel.collection.createIndex({ userId: 1 });
    await DocumentModel.collection.createIndex({
      title: "text",
      content: "text",
    });
    await DocumentModel.collection.createIndex({ createdAt: -1 });
    await DocumentModel.collection.createIndex({ updatedAt: -1 });
    await DocumentModel.collection.createIndex(
      {
        userId: 1,
        createdAt: -1,
      },
      {
        name: "user_documents_by_date",
      },
    );

    // Compound indexes for common query patterns
    await UserModel.collection.createIndex(
      {
        email: 1,
        emailVerified: 1,
      },
      {
        name: "email_verification_lookup",
      },
    );

    await DocumentModel.collection.createIndex(
      {
        userId: 1,
        title: 1,
      },
      {
        name: "user_document_title_lookup",
      },
    );

    logInfo("Database indexes created successfully", {
      indexes: [
        "User: email, username, emailVerified, role, createdAt",
        "UserData: userId, events.date, tasks.completed, tasks.dueDate, photos.uploadDate",
        "Document: userId, title+content text search, createdAt, updatedAt",
        "Compound: email+emailVerified, userId+createdAt, userId+title",
      ],
    });
  } catch (error) {
    logError(error as Error, "create_database_indexes", {
      operation: "database_optimization",
    });
    throw error;
  }
};

/**
 * Lists all existing indexes for monitoring and debugging
 */
export const listDatabaseIndexes = async (): Promise<void> => {
  try {
    const collections = ["users", "userdatas", "documents"];

    for (const collectionName of collections) {
      const collection = mongoose.connection.db?.collection(collectionName);
      if (collection) {
        const indexes = await collection.indexes();
        logInfo(`Indexes for ${collectionName}`, { indexes });
      }
    }
  } catch (error) {
    logError(error as Error, "list_database_indexes");
  }
};
