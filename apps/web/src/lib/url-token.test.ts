import { describe, expect, it } from "vitest";
import { tokenFromHash } from "./url-token.js";

describe("tokenFromHash", () => {
  it("reads the token from the fragment", () => {
    expect(tokenFromHash("#token=abc123")).toBe("abc123");
  });

  it("returns empty when absent", () => {
    expect(tokenFromHash("")).toBe("");
    expect(tokenFromHash("#foo=bar")).toBe("");
  });
});
