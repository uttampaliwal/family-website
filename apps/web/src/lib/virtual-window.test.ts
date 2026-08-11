import { describe, expect, it } from "vitest";
import { computeWindow } from "./virtual-window.js";

function fixedOffsets(count: number, height: number): number[] {
  const offsets = new Array<number>(count + 1).fill(0);
  for (let i = 1; i <= count; i++) offsets[i] = offsets[i - 1]! + height;
  return offsets;
}

function variableOffsets(heights: number[]): number[] {
  const offsets = [0];
  for (const height of heights) {
    offsets.push(offsets[offsets.length - 1]! + height);
  }
  return offsets;
}

describe("computeWindow", () => {
  it("returns nothing for an empty or collapsed list", () => {
    expect(computeWindow([0], 0, 400, 2)).toEqual({ start: 0, end: 0 });
    expect(computeWindow([0, 50], 0, 0, 2)).toEqual({ start: 0, end: 0 });
    expect(computeWindow([0, 50], -1, 400, 2)).toEqual({ start: 0, end: 0 });
  });

  it("draws the visible slice plus overscan on both sides", () => {
    // 20 fixed 50px rows in a 400px viewport → 8 visible, 2 overscan each side.
    const { start, end } = computeWindow(fixedOffsets(20, 50), 0, 400, 2);
    expect(start).toBe(0);
    expect(end).toBe(10);
  });

  it("clamps the start so overscan never goes negative", () => {
    const { start } = computeWindow(fixedOffsets(20, 50), 0, 400, 6);
    expect(start).toBe(0);
  });

  it("clamps the end to the last row", () => {
    const { end } = computeWindow(fixedOffsets(10, 50), 9999, 400, 6);
    expect(end).toBe(10);
  });

  it("moves the window with the scroll position", () => {
    // 50px rows, scrolled 500px in a 400px viewport → rows 10..17 visible.
    const { start, end } = computeWindow(fixedOffsets(50, 50), 500, 400, 1);
    expect(start).toBe(9);
    expect(end).toBe(19);
  });

  it("handles variable row heights", () => {
    // Heights 40, 80, 20, 60, 100 → offsets 0, 40, 120, 140, 200, 300.
    const offsets = variableOffsets([40, 80, 20, 60, 100]);
    // Viewport covers 130..230: rows 2 (120..140), 3 (140..200) and
    // part of 4 (200..300) have visible pixels.
    const { start, end } = computeWindow(offsets, 130, 100, 0);
    expect(start).toBe(2);
    expect(end).toBe(5);
  });

  it("includes a row whose top sits exactly at the viewport edge", () => {
    const offsets = variableOffsets([40, 80, 20, 60]);
    const { end } = computeWindow(offsets, 0, 120, 0);
    expect(end).toBe(2); // offsets[1]=40, offsets[2]=120 → row 2 begins at edge.
  });
});