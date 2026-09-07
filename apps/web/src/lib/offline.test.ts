import { afterEach, describe, expect, it, vi } from "vitest";
import { setAuthToken } from "./api-client.js";
import { OFFLINE_CACHE_PREFIX, clearOfflineDataCaches } from "./offline.js";

afterEach(() => {
  setAuthToken(null);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// Online-first (P1): the service worker no longer caches authenticated API
// responses, so the cache-scope URL machinery was removed. The contract now
// is that sign-out wipes every app-owned cache.

describe("clearOfflineDataCaches", () => {
  it("removes only app-owned caches", async () => {
    const deleted: string[] = [];
    vi.stubGlobal("caches", {
      keys: vi.fn(async () => [
        `${OFFLINE_CACHE_PREFIX}data`,
        "workbox-precache-v2-http://localhost/",
        "other-app-cache",
      ]),
      delete: vi.fn(async (name: string) => {
        deleted.push(name);
        return true;
      }),
    });

    await clearOfflineDataCaches();

    const cachesMock = globalThis.caches as unknown as {
      keys: ReturnType<typeof vi.fn>;
    };
    expect(cachesMock.keys).toHaveBeenCalledOnce();
    expect(deleted).toEqual([`${OFFLINE_CACHE_PREFIX}data`]);
  });
});
