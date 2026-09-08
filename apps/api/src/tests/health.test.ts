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

  it("reports liveness cheaply on /live", async () => {
    const app = createApp();
    const res = await app.request("/api/live");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; service: string };
    expect(body.status).toBe("ok");
    expect(body.service).toBe("family-portal-api");
  });

  it("reports degraded readiness without a database", async () => {
    const app = createApp();
    const res = await app.request("/api/ready");
    // No MongoDB connection in this test process — readiness must fail
    // closed (503) rather than claim ok.
    expect(res.status).toBe(503);
    const body = (await res.json()) as {
      status: string;
      db: { connected: boolean; ping: boolean };
      storage: { remote: boolean; reachable: boolean };
    };
    expect(body.status).toBe("degraded");
    expect(body.db.ping).toBe(false);
  });
});

describe("misc", () => {
  it("returns 404 for unknown routes", async () => {
    const app = createApp();
    const res = await app.request("/api/does-not-exist");
    expect(res.status).toBe(404);
  });
});
