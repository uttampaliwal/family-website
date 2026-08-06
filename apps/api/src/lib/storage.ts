import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { env } from "../config/env.js";
import { AppError } from "../middleware/error.js";

export const UPLOADS_DIR = join(import.meta.dirname, "..", "..", "uploads");
const LOCAL_UPLOAD_LIMIT = 20 * 1024 * 1024;

/** Resolve an upload key to a path, rejecting anything outside the tree. */
export function uploadPathFor(key: string): string {
  if (!key.startsWith("photos/") || /\.\.[/\\]/.test(key)) {
    throw new AppError(400, "INVALID_PHOTO_KEY", "Invalid key");
  }
  return join(UPLOADS_DIR, key);
}

export interface UploadMetadata {
  key: string;
  mimeType: string;
  size: number;
}

export interface StorageBackend {
  readonly isRemote: boolean;
  /** URL the browser PUTs the file to (absolute for R2, relative in dev). */
  requestUploadUrl(metadata: UploadMetadata): Promise<string>;
  /** Verify the object exists with the expected size/type (returns what's stored). */
  confirmUpload(key: string, expected: Pick<UploadMetadata, "mimeType" | "size">): Promise<void>;
  /** URL the browser GETs the object from. */
  getObjectUrl(key: string): Promise<string>;
  deleteObject(key: string): Promise<void>;
}

// ─── Cloudflare R2 (S3-compatible) ─────────────────────────────────────

class R2Storage implements StorageBackend {
  readonly isRemote = true;

  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = env.R2_BUCKET!;
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  async requestUploadUrl({ key, mimeType }: UploadMetadata): Promise<string> {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: mimeType }),
      { expiresIn: 15 * 60 },
    );
  }

  async confirmUpload(
    key: string,
    expected: Pick<UploadMetadata, "mimeType" | "size">,
  ): Promise<void> {
    const head = await this.client.send(
      new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (head.ContentLength !== expected.size || head.ContentType !== expected.mimeType) {
      throw new AppError(400, "UPLOAD_MISMATCH", "Uploaded file doesn't match the request");
    }
  }

  async getObjectUrl(key: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: 60 * 60 },
    );
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

// ─── Local disk (development only) ─────────────────────────────────────

class LocalStorage implements StorageBackend {
  readonly isRemote = false;

  private pathFor(key: string): string {
    return uploadPathFor(key);
  }

  async requestUploadUrl({ key }: UploadMetadata): Promise<string> {
    return `/api/uploads/${key}`;
  }

  async confirmUpload(
    key: string,
    expected: Pick<UploadMetadata, "mimeType" | "size">,
  ): Promise<void> {
    try {
      const info = await stat(this.pathFor(key));
      if (info.size !== expected.size) {
        throw new AppError(400, "UPLOAD_MISMATCH", "Uploaded file doesn't match the request");
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(400, "UPLOAD_MISSING", "Uploaded file not found");
    }
  }

  async getObjectUrl(key: string): Promise<string> {
    return `/api/uploads/${key}`;
  }

  async deleteObject(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }
}

// ─── Factory ───────────────────────────────────────────────────────────

function createStorage(): StorageBackend {
  const r2Vars = [
    env.R2_ACCOUNT_ID,
    env.R2_ACCESS_KEY_ID,
    env.R2_SECRET_ACCESS_KEY,
    env.R2_BUCKET,
  ];
  return r2Vars.every((v) => v) ? new R2Storage() : new LocalStorage();
}

export const storage = createStorage();

export function newPhotoKey(mimeType: string): string {
  const ext: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "image/heic": "heic",
  };
  return `photos/${randomUUID()}.${ext[mimeType] ?? "bin"}`;
}

/** Development-only: persist a browser upload to local disk. */
export async function saveLocalUpload(key: string, body: ArrayBuffer): Promise<void> {
  if (body.byteLength === 0 || body.byteLength > LOCAL_UPLOAD_LIMIT) {
    throw new AppError(400, "UPLOAD_TOO_LARGE", "Upload must be between 1 byte and 20 MB");
  }
  const filePath = uploadPathFor(key);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, Buffer.from(body));
}
