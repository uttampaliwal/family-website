import { AppError } from "../middleware/error.js";
import { storage } from "./storage.js";

/**
 * Server-side file-signature sniffing. Upload validation today trusts the
 * client-declared MIME; this proves the stored bytes start like the claimed
 * type. Plain text has no signature and is always accepted (it is served
 * with forced-attachment downloads, never rendered inline).
 */

function startsWith(head: Uint8Array, sig: number[]): boolean {
  return sig.every((b, i) => head[i] === b);
}

function ascii(head: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...head.subarray(start, start + length));
}

function isZip(head: Uint8Array): boolean {
  return (
    startsWith(head, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(head, [0x50, 0x4b, 0x05, 0x06])
  );
}

function isOle(head: Uint8Array): boolean {
  return startsWith(head, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
}

function isFtyp(head: Uint8Array): boolean {
  return head.length >= 12 && ascii(head, 4, 4) === "ftyp";
}

export function verifyMagicBytes(mimeType: string, head: Uint8Array): void {
  let ok = false;
  switch (mimeType) {
    case "image/jpeg":
      ok = startsWith(head, [0xff, 0xd8, 0xff]);
      break;
    case "image/png":
      ok = startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      break;
    case "image/gif":
      ok = ascii(head, 0, 6) === "GIF87a" || ascii(head, 0, 6) === "GIF89a";
      break;
    case "image/webp":
      ok =
        head.length >= 12 &&
        ascii(head, 0, 4) === "RIFF" &&
        ascii(head, 8, 4) === "WEBP";
      break;
    case "image/avif":
    case "image/heic":
      // ISO BMFF containers — brand check only (`ftyp` box present).
      ok = isFtyp(head);
      break;
    case "application/pdf":
      ok = ascii(head, 0, 5) === "%PDF-";
      break;
    case "application/zip":
      ok = isZip(head);
      break;
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      // OOXML is a ZIP container.
      ok = isZip(head);
      break;
    case "application/msword":
    case "application/vnd.ms-excel":
    case "application/vnd.ms-powerpoint":
      // Legacy OLE compound documents.
      ok = isOle(head);
      break;
    case "text/plain":
      ok = true;
      break;
    default:
      ok = false;
  }
  if (!ok) {
    throw new AppError(
      400,
      "UPLOAD_TYPE_MISMATCH",
      "Uploaded file doesn't match its declared type",
    );
  }
}

/**
 * Full server-side upload confirmation: existence + size + declared MIME
 * (via storage metadata) plus byte-signature sniffing. The client-supplied
 * SHA-256 is stored alongside the metadata for P4 reconciliation — it is
 * tamper-evident, not server-verified (verification would require pulling
 * the whole object back through the API).
 */
export async function confirmStoredUpload(
  key: string,
  expected: { mimeType: string; size: number },
): Promise<void> {
  await storage.confirmUpload(key, expected);
  verifyMagicBytes(expected.mimeType, await storage.peekHead(key));
}
