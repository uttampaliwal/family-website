import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { auditStorage } from "../lib/storage-audit.js";
import { saveLocalUpload, storage } from "../lib/storage.js";
import { KulayaDocument } from "../models/document.js";
import { Photo } from "../models/photo.js";

let mongo: MongoMemoryServer;
const stamp = Date.now().toString(36);

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

async function putLocal(key: string, bytes: Uint8Array): Promise<void> {
  await saveLocalUpload(key, Uint8Array.from(bytes).buffer as ArrayBuffer);
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri("family-portal"));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("storage audit", () => {
  it("reports orphan, phantom, and size drift", async () => {
    const cleanKey = `photos/clean-${stamp}.jpg`;
    const orphanKey = `photos/orphan-${stamp}.jpg`;
    const phantomKey = `documents/phantom-${stamp}.pdf`;
    const driftKey = `photos/drift-${stamp}.jpg`;
    const uploader = new mongoose.Types.ObjectId();

    await putLocal(cleanKey, JPEG);
    await Photo.create({
      key: cleanKey,
      mimeType: "image/jpeg",
      size: JPEG.byteLength,
      uploadedBy: uploader,
    });

    await putLocal(orphanKey, JPEG);

    await KulayaDocument.create({
      key: phantomKey,
      name: "phantom.pdf",
      mimeType: "application/pdf",
      size: 8,
      uploadedBy: uploader,
    });

    await putLocal(driftKey, JPEG);
    await Photo.create({
      key: driftKey,
      mimeType: "image/jpeg",
      size: 999,
      uploadedBy: uploader,
    });

    const report = await auditStorage();
    const byKey = new Map(report.issues.map((i) => [i.key, i.kind]));

    expect(byKey.get(cleanKey)).toBeUndefined();
    expect(byKey.get(orphanKey)).toBe("ORPHAN");
    expect(byKey.get(phantomKey)).toBe("PHANTOM");
    expect(byKey.get(driftKey)).toBe("SIZE_MISMATCH");
    expect(report.dbObjects).toBeGreaterThanOrEqual(3);
    expect(report.storedObjects).toBeGreaterThanOrEqual(3);

    await storage.deleteObject(cleanKey);
    await storage.deleteObject(orphanKey);
    await storage.deleteObject(driftKey);
    await Photo.deleteMany({});
    await KulayaDocument.deleteMany({});
  });

  it("is clean when metadata and bytes agree", async () => {
    const key = `documents/agree-${stamp}.pdf`;
    const bytes = new TextEncoder().encode("%PDF-1.4 agree");
    await putLocal(key, bytes);
    await KulayaDocument.create({
      key,
      name: "agree.pdf",
      mimeType: "application/pdf",
      size: bytes.byteLength,
      uploadedBy: new mongoose.Types.ObjectId(),
    });

    const report = await auditStorage();
    // Other suites leave local files behind without metadata; scope the
    // cleanliness check to this test's keys.
    expect(report.issues.filter((i) => i.key.includes(stamp))).toEqual([]);

    await storage.deleteObject(key);
    await KulayaDocument.deleteMany({});
  });
});
