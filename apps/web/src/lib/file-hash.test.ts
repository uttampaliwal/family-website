import { describe, expect, it } from "vitest";
import { sha256HexOf } from "./file-hash.js";

describe("sha256HexOf", () => {
  it("hashes the exact bytes (NIST vector for 'abc')", async () => {
    const blob = new Blob(["abc"]);
    await expect(sha256HexOf(blob)).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("differs for different bytes", async () => {
    const a = await sha256HexOf(new Blob(["a"]));
    const b = await sha256HexOf(new Blob(["b"]));
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});
