import { KulayaDocument } from "../models/document.js";
import { Photo } from "../models/photo.js";
import { storage } from "./storage.js";

export type AuditIssueKind =
  "ORPHAN" | "PHANTOM" | "SIZE_MISMATCH" | "MIME_MISMATCH";

export interface AuditIssue {
  kind: AuditIssueKind;
  key: string;
  detail: string;
}

export interface StorageAuditReport {
  checkedAt: string;
  /** Metadata rows (photos + documents, excluding soft-deleted). */
  dbObjects: number;
  /** Objects found in storage under photos/ + documents/. */
  storedObjects: number;
  issues: AuditIssue[];
}

/**
 * Reconciles Mongo metadata against stored bytes. Mongo and R2 are not one
 * atomic transaction (direct-to-storage uploads + separate registration),
 * so drift is expected over time — this reports it:
 * - ORPHAN: bytes exist with no metadata (abandoned upload) → safe to purge
 * - PHANTOM: metadata points at missing bytes → re-upload or drop metadata
 * - SIZE_MISMATCH / MIME_MISMATCH: partial/corrupt upload → re-upload
 */
export async function auditStorage(): Promise<StorageAuditReport> {
  const [photos, documents] = await Promise.all([
    Photo.find(
      { deletedAt: { $exists: false } },
      { key: 1, size: 1, mimeType: 1 },
    ).lean(),
    KulayaDocument.find(
      { deletedAt: { $exists: false } },
      { key: 1, size: 1, mimeType: 1 },
    ).lean(),
  ]);
  const metadata = new Map(
    [...photos, ...documents].map((d) => [
      d.key,
      { size: d.size, mimeType: d.mimeType },
    ]),
  );

  const [photoObjects, documentObjects] = await Promise.all([
    storage.listObjects("photos/"),
    storage.listObjects("documents/"),
  ]);
  const stored = new Map(
    [...photoObjects, ...documentObjects].map((o) => [o.key, o.size]),
  );

  const issues: AuditIssue[] = [];

  for (const [key, storedSize] of stored) {
    const meta = metadata.get(key);
    if (!meta) {
      issues.push({
        kind: "ORPHAN",
        key,
        detail: `no metadata row; ${storedSize} bytes safe to purge after review`,
      });
    } else if (meta.size !== storedSize) {
      issues.push({
        kind: "SIZE_MISMATCH",
        key,
        detail: `metadata says ${meta.size} bytes, storage has ${storedSize}`,
      });
    }
  }

  for (const [key, meta] of metadata) {
    if (!stored.has(key)) {
      issues.push({ kind: "PHANTOM", key, detail: "metadata without bytes" });
      continue;
    }
    // MIME is only comparable where the backend records it (R2); local
    // disk stores no content-type metadata.
    const head = await storage.headObject(key);
    if (head?.mimeType && head.mimeType !== meta.mimeType) {
      issues.push({
        kind: "MIME_MISMATCH",
        key,
        detail: `metadata says ${meta.mimeType}, storage has ${head.mimeType}`,
      });
    }
  }

  return {
    checkedAt: new Date().toISOString(),
    dbObjects: metadata.size,
    storedObjects: stored.size,
    issues,
  };
}
