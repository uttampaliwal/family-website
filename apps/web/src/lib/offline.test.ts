import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cacheableUrl,
  isCacheableApiPath,
  setAuthToken,
} from "./api-client.js";
import { OFFLINE_CACHE_PREFIX, clearOfflineDataCaches } from "./offline.js";

afterEach(() => {
  setAuthToken(null);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("isCacheableApiPath", () => {
  it("matches the offline-first resource groups", () => {
    expect(isCacheableApiPath("/members")).toBe(true);
    expect(isCacheableApiPath("/members/abc123")).toBe(true);
    expect(isCacheableApiPath("/members/tree")).toBe(true);
    expect(isCacheableApiPath("/photos")).toBe(true);
    expect(isCacheableApiPath("/photos/abc123")).toBe(true);
    expect(isCacheableApiPath("/events")).toBe(true);
    expect(isCacheableApiPath("/announcements")).toBe(true);
  });

  it("leaves everything else untouched", () => {
    expect(isCacheableApiPath("/posts")).toBe(false);
    expect(isCacheableApiPath("/auth/refresh")).toBe(false);
    expect(isCacheableApiPath("/members-only")).toBe(false);
    expect(isCacheableApiPath("/documents")).toBe(false);
    expect(isCacheableApiPath("/membership/claim")).toBe(false);
  });
});

describe("cacheableUrl", () => {
  it("carries the session scope on cacheable GETs", () => {
    setAuthToken("prefix_ABCDEF123456");
    expect(cacheableUrl("/members")).toBe("/members?_scope=ABCDEF123456");
    expect(cacheableUrl("/events")).toBe("/events?_scope=ABCDEF123456");
  });

  it("appends the scope after existing query params", () => {
    setAuthToken("prefix_ABCDEF123456");
    expect(cacheableUrl("/events?from=1&to=2")).toBe(
      "/events?from=1&to=2&_scope=ABCDEF123456",
    );
    expect(cacheableUrl("/members?search=adi&pageSize=48")).toBe(
      "/members?search=adi&pageSize=48&_scope=ABCDEF123456",
    );
  });

  it("does not scope anonymous requests", () => {
    setAuthToken("prefix_ABCDEF123456");
    expect(cacheableUrl("/posts")).toBe("/posts");
    setAuthToken(null);
    expect(cacheableUrl("/members")).toBe("/members");
  });

  it("rotates the scope when the session rotates", () => {
    setAuthToken("one_111111111111");
    expect(cacheableUrl("/photos")).toBe("/photos?_scope=111111111111");
    setAuthToken("two_999999999999");
    expect(cacheableUrl("/photos")).toBe("/photos?_scope=999999999999");
  });
});

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

    const cachesMock = globalThis.caches as unknown as { keys: ReturnType<typeof vi.fn> };
    expect(cachesMock.keys).toHaveBeenCalledOnce();
    expect(deleted).toEqual([`${OFFLINE_CACHE_PREFIX}data`]);
  });
});