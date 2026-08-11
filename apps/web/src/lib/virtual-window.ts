/**
 * Pure windowing math for the virtual list. `offsets[i]` is the y position
 * of row i and `offsets[i + 1]` its end; `offsets[offsets.length - 1]` is
 * the total content height. Given the scroll position and viewport size it
 * returns the slice of indices that should be in the DOM (plus overscan).
 */
export function computeWindow(
  offsets: number[],
  scrollTop: number,
  viewport: number,
  overscan: number,
): { start: number; end: number } {
  const count = offsets.length - 1;
  if (count <= 0 || viewport <= 0 || scrollTop < 0) {
    return { start: 0, end: 0 };
  }

  // First row whose bottom is below the viewport top.
  let first = 0;
  let lo = 0;
  let hi = count - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (offsets[mid + 1]! > scrollTop) {
      first = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }

  // Last row whose top is above the viewport bottom.
  const floor = scrollTop + viewport;
  let last = count - 1;
  lo = 0;
  hi = count - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (offsets[mid]! < floor) {
      last = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return {
    start: Math.max(0, first - overscan),
    end: Math.min(count, last + 1 + overscan),
  };
}

/** Binary-search-free helper: absolute y of a row given cumulative offsets. */
export function offsetAt(offsets: number[], index: number): number {
  return offsets[index] ?? 0;
}