import request from "supertest";
import { Express } from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createTestApp } from "../helpers/testApp.js";
import { User } from "../../models/User.js";
import bcrypt from "bcryptjs";

describe("User Management Integration Tests", () => {
  let app: Express;
  let mongoServer: MongoMemoryServer;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    app = createTestApp();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});

    // Create and authenticate a test user
    const hashedPassword = await bcrypt.hash("TestPassword123!", 12);
    const user = await User.create({
      username: "testuser",
      email: "test@example.com",
      password: hashedPassword,
      firstName: "Test",
      lastName: "User",
      dateOfBirth: new Date("1990-01-01"),
      isEmailVerified: true,
      termsAccepted: true,
    });

    userId = user._id.toString();

    // Login to get auth token
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "TestPassword123!",
    });

    authToken = loginResponse.body.accessToken;
  });

  describe("GET /api/users/profile", () => {
    it("should get user profile when authenticated", async () => {
      const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("username", "testuser");
      expect(response.body.user).toHaveProperty("email", "test@example.com");
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should reject unauthenticated requests", async () => {
      await request(app).get("/api/users/profile").expect(401);
    });

    it("should reject invalid auth tokens", async () => {
      await request(app)
        .get("/api/users/profile")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });
  });

  describe("PUT /api/users/profile", () => {
    it("should update user profile successfully", async () => {
      const updateData = {
        firstName: "Updated",
        lastName: "Name",
        bio: "Updated bio information",
      };

      const response = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Profile updated successfully",
      );
      expect(response.body.user).toHaveProperty("firstName", "Updated");
      expect(response.body.user).toHaveProperty("lastName", "Name");
      expect(response.body.user).toHaveProperty(
        "bio",
        "Updated bio information",
      );
    });

    it("should validate required fields", async () => {
      const invalidData = {
        firstName: "", // Empty required field
        lastName: "Name",
      };

      await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it("should sanitize input data", async () => {
      const maliciousData = {
        firstName: '<script>alert("xss")</script>Safe',
        lastName: "Name",
        bio: '<img src="x" onerror="alert(1)">',
      };

      const response = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(200);

      expect(response.body.user.firstName).not.toContain("<script>");
      expect(response.body.user.bio).not.toContain("onerror");
    });
  });

  describe("POST /api/users/change-password", () => {
    it("should change password with valid current password", async () => {
      const passwordData = {
        currentPassword: "TestPassword123!",
        newPassword: "NewPassword123!",
        confirmNewPassword: "NewPassword123!",
      };

      const response = await request(app)
        .post("/api/users/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Password changed successfully",
      );

      // Verify old password no longer works
      await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "TestPassword123!",
        })
        .expect(401);

      // Verify new password works
      await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "NewPassword123!",
        })
        .expect(200);
    });

    it("should reject incorrect current password", async () => {
      const passwordData = {
        currentPassword: "WrongPassword123!",
        newPassword: "NewPassword123!",
        confirmNewPassword: "NewPassword123!",
      };

      await request(app)
        .post("/api/users/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);
    });

    it("should validate password strength", async () => {
      const passwordData = {
        currentPassword: "TestPassword123!",
        newPassword: "weak",
        confirmNewPassword: "weak",
      };

      await request(app)
        .post("/api/users/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);
    });

    it("should reject mismatched password confirmation", async () => {
      const passwordData = {
        currentPassword: "TestPassword123!",
        newPassword: "NewPassword123!",
        confirmNewPassword: "DifferentPassword123!",
      };

      await request(app)
        .post("/api/users/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);
    });
  });

  describe("DELETE /api/users/account", () => {
    it("should delete user account with correct password", async () => {
      const deleteData = {
        password: "TestPassword123!",
        confirmation: "DELETE MY ACCOUNT",
      };

      const response = await request(app)
        .delete("/api/users/account")
        .set("Authorization", `Bearer ${authToken}`)
        .send(deleteData)
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Account deleted successfully",
      );

      // Verify user no longer exists
      const user = await User.findById(userId);
      expect(user).toBeNull();
    });

    it("should reject account deletion with incorrect password", async () => {
      const deleteData = {
        password: "WrongPassword123!",
        confirmation: "DELETE MY ACCOUNT",
      };

      await request(app)
        .delete("/api/users/account")
        .set("Authorization", `Bearer ${authToken}`)
        .send(deleteData)
        .expect(400);

      // Verify user still exists
      const user = await User.findById(userId);
      expect(user).not.toBeNull();
    });

    it("should reject account deletion without proper confirmation", async () => {
      const deleteData = {
        password: "TestPassword123!",
        confirmation: "wrong confirmation",
      };

      await request(app)
        .delete("/api/users/account")
        .set("Authorization", `Bearer ${authToken}`)
        .send(deleteData)
        .expect(400);
    });
  });
});
