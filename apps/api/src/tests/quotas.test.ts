import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { env } from "../config/env.js";
import {
  checkUploadQuota,
  familyUsageBytes,
  recordUploadUsage,
} from "../lib/quotas.js";
import { AppError } from "../middleware/error.js";
import { Photo } from "../models/photo.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri("family-portal"));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

async function checkFails(userId: string, size: number): Promise<AppError> {
  try {
    await checkUploadQuota(userId, size);
  } catch (err) {
    return err as AppError;
  }
  throw new Error("quota check unexpectedly passed");
}

describe("upload quotas", () => {
  it("allows uploads inside the daily budget", async () => {
    await checkUploadQuota(`member-a-${Date.now()}`, 1024);
  });

  it("rejects files beyond the daily count", async () => {
    const userId = `member-b-${Date.now()}`;
    for (let i = 0; i < env.UPLOAD_DAILY_FILES; i += 1) {
      recordUploadUsage(userId, 1);
    }
    const err = await checkFails(userId, 1);
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(429);
    expect(err.code).toBe("UPLOAD_QUOTA_EXCEEDED");
  });

  it("rejects bytes beyond the daily budget", async () => {
    const userId = `member-c-${Date.now()}`;
    recordUploadUsage(userId, env.UPLOAD_DAILY_BYTES);
    const err = await checkFails(userId, 1);
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(429);
    expect(err.code).toBe("UPLOAD_QUOTA_EXCEEDED");
  });

  it("tracks family usage across photos and documents", async () => {
    await Photo.create({
      key: `photos/quota-${Date.now()}.jpg`,
      mimeType: "image/jpeg",
      size: 1234,
      uploadedBy: new mongoose.Types.ObjectId(),
    });
    expect(await familyUsageBytes()).toBeGreaterThanOrEqual(1234);
  });
});
