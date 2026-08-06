import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

describe("health-check", () => {
  it("returns ok with service metadata", async () => {
    const app = createApp();
    const res = await app.request("/api/health-check");

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      status: string;
      service: string;
      timestamp: string;
    };
    expect(body.status).toBe("ok");
    expect(body.service).toBe("family-portal-api");
    expect(typeof body.timestamp).toBe("string");
  });
});

describe("misc", () => {
  it("returns 404 for unknown routes", async () => {
    const app = createApp();
    const res = await app.request("/api/does-not-exist");
    expect(res.status).toBe(404);
  });
});
