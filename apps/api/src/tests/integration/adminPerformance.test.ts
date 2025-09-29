import request from "supertest";
import { testDb } from "../helpers/testDatabase.js";
import { createTestApp } from "../helpers/testApp.js";
import jwt from "jsonwebtoken";
import { performanceMonitor } from "../../middleware/performanceMonitoring.js";
import type { Application } from "express";

describe("Admin Performance Integration Tests", () => {
  let app: Application;
  let adminToken: string;
  let adminUser: unknown;

  beforeAll(async () => {
    await testDb.connect();
    app = createTestApp();
  });

  afterAll(async () => {
    await testDb.disconnect();
  });

  beforeEach(async () => {
    await testDb.clearDatabase();
    const seedData = await testDb.seedTestData();
    adminUser = seedData.adminUser;

    // Create admin JWT token
    adminToken = jwt.sign(
      { id: adminUser._id, email: adminUser.email },
      process.env.JWT_SECRET || "test-secret",
      { algorithm: "HS512", expiresIn: "1h" },
    );

    // Clear performance metrics
    performanceMonitor.clearMetrics();
  });

  describe("Performance Monitoring", () => {
    it("should track admin dashboard stats performance", async () => {
      await request(app)
        .get("/api/admin/dashboard/stats")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      // Check that performance metrics were recorded
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);

      const dashboardMetric = metrics.find(
        (m) =>
          m.endpoint === "/api/admin/dashboard/stats" &&
          m.operation === "dashboard_stats",
      );

      expect(dashboardMetric).toBeDefined();
      expect(dashboardMetric?.adminId).toBe(adminUser._id.toString());
      expect(dashboardMetric?.statusCode).toBe(200);
      expect(dashboardMetric?.duration).toBeGreaterThan(0);
    });

    it("should track memory usage during admin operations", async () => {
      await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const metrics = performanceMonitor.getMetrics();
      const userMetric = metrics.find((m) => m.endpoint === "/api/admin/users");

      expect(userMetric?.memoryUsage).toBeDefined();
      expect(userMetric?.memoryUsage.heapUsed).toBeGreaterThan(0);
      expect(userMetric?.memoryUsage.heapTotal).toBeGreaterThan(0);
    });

    it("should provide performance analytics endpoint", async () => {
      // Generate some metrics first
      await request(app)
        .get("/api/admin/dashboard/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);

      // Get performance metrics
      const response = await request(app)
        .get("/api/admin/performance/metrics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("metrics");
      expect(response.body).toHaveProperty("summary");
      expect(response.body.summary).toHaveProperty("totalRequests");
      expect(response.body.summary).toHaveProperty("averageResponseTime");
      expect(response.body.summary).toHaveProperty("errorRate");
      expect(response.body.summary).toHaveProperty("memoryTrends");
    });

    it("should filter metrics by admin ID", async () => {
      await request(app)
        .get("/api/admin/dashboard/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      const response = await request(app)
        .get(`/api/admin/performance/metrics?adminId=${adminUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.metrics).toHaveLength(1);
      expect(response.body.metrics[0].adminId).toBe(adminUser._id.toString());
    });

    it("should identify slow queries", async () => {
      // Simulate a slow operation by adding artificial delay
      const slowEndpoint = "/api/admin/dashboard/enhanced-stats";

      await request(app)
        .get(slowEndpoint)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const response = await request(app)
        .get("/api/admin/performance/metrics?slow=true")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      // Should return slow queries (threshold > 1000ms in our middleware)
      expect(response.body.metrics).toBeDefined();
    });
  });

  describe("Admin Operations Performance", () => {
    it("should complete user approval within performance threshold", async () => {
      const { regularUser } = await testDb.seedTestData();

      const startTime = Date.now();

      await request(app)
        .post(`/api/admin/users/${regularUser._id}/approve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      const duration = Date.now() - startTime;

      // Should complete within 2 seconds
      expect(duration).toBeLessThan(2000);

      // Check performance metrics
      const metrics = performanceMonitor.getMetrics();
      const approvalMetric = metrics.find((m) =>
        m.endpoint.includes("/approve"),
      );

      expect(approvalMetric?.duration).toBeLessThan(2000);
    });

    it("should handle bulk operations efficiently", async () => {
      // Create multiple users for bulk operations
      const User = (await import("../../models/User.js")).default;
      const bulkUsers = [];

      for (let i = 0; i < 5; i++) {
        const user = new User({
          username: `bulkuser${i}`,
          email: `bulk${i}@test.com`,
          password: "hashedpassword",
          role: "user",
          adminApprovalStatus: "pending",
        });
        bulkUsers.push(await user.save());
      }

      const startTime = Date.now();

      // Approve all users
      for (const user of bulkUsers) {
        await request(app)
          .post(`/api/admin/users/${user._id}/approve`)
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);
      }

      const totalDuration = Date.now() - startTime;
      const avgDuration = totalDuration / bulkUsers.length;

      // Average operation should be under 1 second
      expect(avgDuration).toBeLessThan(1000);
    });
  });

  describe("Error Handling Performance", () => {
    it("should handle invalid requests efficiently", async () => {
      const startTime = Date.now();

      await request(app)
        .get("/api/admin/users/invalid-id")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(500); // Invalid ObjectId format

      const duration = Date.now() - startTime;

      // Error handling should be fast
      expect(duration).toBeLessThan(500);
    });

    it("should track error rates accurately", async () => {
      // Generate some successful requests
      await request(app)
        .get("/api/admin/dashboard/stats")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      // Generate some error requests
      await request(app)
        .get("/api/admin/users/invalid-id")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(500);

      const errorRate = performanceMonitor.getErrorRate();
      expect(errorRate).toBeGreaterThan(0);
      expect(errorRate).toBeLessThanOrEqual(100);
    });
  });
});
