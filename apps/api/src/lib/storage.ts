import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { env } from "../config/env.js";
import { AppError } from "../middleware/error.js";

export const UPLOADS_DIR = join(import.meta.dirname, "..", "..", "uploads");
const LOCAL_UPLOAD_LIMIT = 25 * 1024 * 1024;

/** Resolve an upload key to a path, rejecting anything outside the tree. */
export function uploadPathFor(key: string): string {
  if (
    !(key.startsWith("photos/") || key.startsWith("documents/")) ||
    /\.\.[/\\]/.test(key)
  ) {
    throw new AppError(400, "INVALID_KEY", "Invalid key");
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
  confirmUpload(
    key: string,
    expected: Pick<UploadMetadata, "mimeType" | "size">,
  ): Promise<void>;
  /** Size + declared type of the stored object, or null when missing. */
  headObject(key: string): Promise<{ size: number; mimeType?: string } | null>;
  /** All stored keys under a prefix (for reconciliation). */
  listObjects(prefix: string): Promise<Array<{ key: string; size: number }>>;
  /** First bytes of the stored object, for server-side type sniffing. */
  peekHead(key: string, maxBytes?: number): Promise<Uint8Array>;
  /** URL the browser GETs the object from. */
  getObjectUrl(key: string, opts?: DownloadOptions): Promise<string>;
  deleteObject(key: string): Promise<void>;
}

export interface DownloadOptions {
  /** Attachment filename; implies `Content-Disposition: attachment`. */
  filename?: string;
  contentType?: string;
  /** Signed-URL lifetime in seconds. Downloads are short (10 min default);
   * gallery view URLs pass a longer window explicitly. */
  expiresInSec?: number;
}

/** Default signed-URL lifetime for downloads — bounds revoked-share replay. */
export const DOWNLOAD_URL_TTL_SEC = 10 * 60;

/** `Content-Disposition: attachment` with RFC 5987 encoding for non-ASCII. */
export function contentDisposition(filename: string): string {
  const safe = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
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
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimeType,
      }),
      { expiresIn: 15 * 60 },
    );
  }

  async confirmUpload(
    key: string,
    expected: Pick<UploadMetadata, "mimeType" | "size">,
  ): Promise<void> {
    const head = await this.headObject(key);
    if (
      !head ||
      head.size !== expected.size ||
      head.mimeType !== expected.mimeType
    ) {
      throw new AppError(
        400,
        head ? "UPLOAD_MISMATCH" : "UPLOAD_MISSING",
        head
          ? "Uploaded file doesn't match the request"
          : "Uploaded file not found",
      );
    }
  }

  async headObject(
    key: string,
  ): Promise<{ size: number; mimeType?: string } | null> {
    try {
      const head = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      if (head.ContentLength === undefined) return null;
      return { size: head.ContentLength, mimeType: head.ContentType };
    } catch {
      return null;
    }
  }

  async listObjects(
    prefix: string,
  ): Promise<Array<{ key: string; size: number }>> {
    const out: Array<{ key: string; size: number }> = [];
    let token: string | undefined;
    do {
      const res = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: token,
        }),
      );
      for (const obj of res.Contents ?? []) {
        if (obj.Key !== undefined && obj.Size !== undefined) {
          out.push({ key: obj.Key, size: obj.Size });
        }
      }
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);
    return out;
  }

  async peekHead(key: string, maxBytes = 32): Promise<Uint8Array> {
    const res = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Range: `bytes=0-${maxBytes - 1}`,
      }),
    );
    if (!res.Body)
      throw new AppError(400, "UPLOAD_MISSING", "Uploaded file not found");
    return new Uint8Array(await res.Body.transformToByteArray());
  }

  async getObjectUrl(key: string, opts: DownloadOptions = {}): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ...(opts.filename
        ? { ResponseContentDisposition: contentDisposition(opts.filename) }
        : {}),
      ...(opts.contentType ? { ResponseContentType: opts.contentType } : {}),
    });
    return getSignedUrl(this.client, command, {
      expiresIn: opts.expiresInSec ?? DOWNLOAD_URL_TTL_SEC,
    });
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
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
        throw new AppError(
          400,
          "UPLOAD_MISMATCH",
          "Uploaded file doesn't match the request",
        );
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(400, "UPLOAD_MISSING", "Uploaded file not found");
    }
  }

  async getObjectUrl(key: string): Promise<string> {
    return `/api/uploads/${key}`;
  }

  async headObject(
    key: string,
  ): Promise<{ size: number; mimeType?: string } | null> {
    try {
      const info = await stat(this.pathFor(key));
      // Local disk stores no content-type metadata — size only.
      return { size: info.size };
    } catch {
      return null;
    }
  }

  async listObjects(
    prefix: string,
  ): Promise<Array<{ key: string; size: number }>> {
    const out: Array<{ key: string; size: number }> = [];
    const walk = async (dir: string, keyPrefix: string): Promise<void> => {
      let entries;
      try {
        entries = await readdir(join(UPLOADS_DIR, dir), {
          withFileTypes: true,
        });
      } catch {
        return;
      }
      for (const entry of entries) {
        if (entry.isDirectory()) {
          await walk(`${dir}/${entry.name}`, `${keyPrefix}${entry.name}/`);
        } else {
          const info = await stat(join(UPLOADS_DIR, dir, entry.name));
          out.push({ key: `${keyPrefix}${entry.name}`, size: info.size });
        }
      }
    };
    await walk(prefix.replace(/\/$/, ""), `${prefix.replace(/\/$/, "")}/`);
    return out;
  }

  async peekHead(key: string, maxBytes = 32): Promise<Uint8Array> {
    try {
      const data = await readFile(this.pathFor(key));
      return new Uint8Array(data.subarray(0, maxBytes));
    } catch {
      throw new AppError(400, "UPLOAD_MISSING", "Uploaded file not found");
    }
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
  if (env.NODE_ENV === "production" && !r2Vars.every((v) => v)) {
    // Defense in depth behind env.ts production validation: never silently
    // serve uploads from ephemeral local disk in production.
    throw new Error("R2 storage is mandatory in production");
  }
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

export function newDocumentKey(mimeType: string): string {
  const ext: Record<string, string> = {
    "application/pdf": "pdf",
    "text/plain": "txt",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "pptx",
    "application/zip": "zip",
  };
  return `documents/${randomUUID()}.${ext[mimeType] ?? "bin"}`;
}

/** Development-only: persist a browser upload to local disk. */
export async function saveLocalUpload(
  key: string,
  body: ArrayBuffer,
  maxBytes = LOCAL_UPLOAD_LIMIT,
): Promise<void> {
  if (body.byteLength === 0 || body.byteLength > maxBytes) {
    throw new AppError(
      400,
      "UPLOAD_TOO_LARGE",
      `Upload must be between 1 byte and ${Math.floor(maxBytes / (1024 * 1024))} MB`,
    );
  }
  const filePath = uploadPathFor(key);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, Buffer.from(body));
}
