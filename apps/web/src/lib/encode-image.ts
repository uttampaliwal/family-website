/**
 * Client-side photo compression. Phones upload 12MP+ originals; we re-encode
 * to WebP at a sane max dimension before the file ever leaves the browser.
 * Formats we cannot safely re-encode (animated GIF, HEIC, AVIF decode
 * support varies) pass through untouched — encoding must never block or
 * break an upload, so every step falls back to the original file.
 */

export const REENCODABLE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/** Max long edge for re-encoded photos (large enough to print/share). */
export const MAX_PHOTO_DIMENSION = 2560;

export const WEBP_QUALITY = 0.82;

export function shouldReencode(mimeType: string): boolean {
  return REENCODABLE_TYPES.has(mimeType);
}

/** Downscale-only fit; returns the same dimensions when already small. */
export function targetFit(
  width: number,
  height: number,
  maxDim = MAX_PHOTO_DIMENSION,
): { width: number; height: number } {
  if (width <= maxDim && height <= maxDim) return { width, height };
  const scale = maxDim / Math.max(width, height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export interface EncodedPhoto {
  /** File or WebP blob — always has .type and .size. */
  blob: Blob;
  mimeType: string;
}

export async function encodePhoto(file: File): Promise<EncodedPhoto> {
  try {
    if (!shouldReencode(file.type)) return { blob: file, mimeType: file.type };

    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    try {
      const { width, height } = targetFit(bitmap.width, bitmap.height);
      if (file.type === "image/webp" && width === bitmap.width && height === bitmap.height) {
        return { blob: file, mimeType: file.type };
      }
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d");
      if (!ctx) return { blob: file, mimeType: file.type };
      ctx.drawImage(bitmap, 0, 0, width, height);
      const blob = await canvas.convertToBlob({ type: "image/webp", quality: WEBP_QUALITY });
      if (!blob || blob.size === 0) return { blob: file, mimeType: file.type };
      return { blob, mimeType: "image/webp" };
    } finally {
      bitmap.close();
    }
  } catch {
    return { blob: file, mimeType: file.type };
  }
}