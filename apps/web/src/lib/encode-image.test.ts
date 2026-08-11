import { describe, expect, it } from "vitest";
import {
  MAX_PHOTO_DIMENSION,
  shouldReencode,
  targetFit,
} from "./encode-image.js";

describe("shouldReencode", () => {
  it("re-encodes raster formats the browser can decode", () => {
    expect(shouldReencode("image/jpeg")).toBe(true);
    expect(shouldReencode("image/png")).toBe(true);
    expect(shouldReencode("image/webp")).toBe(true);
  });

  it("passes through formats we cannot safely re-encode", () => {
    expect(shouldReencode("image/gif")).toBe(false);
    expect(shouldReencode("image/heic")).toBe(false);
    expect(shouldReencode("image/avif")).toBe(false);
  });
});

describe("targetFit", () => {
  it("keeps photos already within the max dimension", () => {
    expect(targetFit(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it("downscales the long edge to the max dimension", () => {
    expect(targetFit(4000, 3000)).toEqual({
      width: MAX_PHOTO_DIMENSION,
      height: 1920,
    });
  });

  it("never upscales and never produces zero dimensions", () => {
    expect(targetFit(200, 10000)).toEqual({ width: 51, height: MAX_PHOTO_DIMENSION });
    expect(targetFit(10, 5000).width).toBeGreaterThanOrEqual(1);
  });

  it("honours a custom max dimension", () => {
    expect(targetFit(3000, 2000, 800)).toEqual({ width: 800, height: 533 });
  });
});