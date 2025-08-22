import request from "supertest";
import express from "express";
import healthRoutes from "./health";

// Constants for better maintainability
const HEALTH_ENDPOINT = "/health/health-check";
const EXPECTED_STATUS = 200;
const EXPECTED_RESPONSE = { status: "UP" };

const app = express();
app.use("/health", healthRoutes);

describe("Health API", () => {
  it("should return 200 OK for the health check", async () => {
    const res = await request(app).get(HEALTH_ENDPOINT);
    expect(res.statusCode).toEqual(EXPECTED_STATUS);
    expect(res.body.status).toEqual(EXPECTED_RESPONSE.status);
    expect(typeof res.body.timestamp).toBe("string");
  });
});
