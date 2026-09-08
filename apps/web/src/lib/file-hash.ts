async function blobToBytes(blob: Blob): Promise<ArrayBuffer> {
  // Browsers implement Blob.arrayBuffer; jsdom (tests) only has FileReader.
  if (typeof blob.arrayBuffer === "function") return blob.arrayBuffer();
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () =>
      reject(reader.error ?? new Error("Blob read failed"));
    reader.readAsArrayBuffer(blob);
  });
}

/** SHA-256 of the exact bytes being uploaded (post-encode, pre-PUT). */
export async function sha256HexOf(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await blobToBytes(blob));
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
