import { useEffect, useState } from "react";

/** Cache names prefixed this way are data caches owned by the app. */
export const OFFLINE_CACHE_PREFIX = "kulaya-";

/** True while the browser reports no network. Hydrates from navigator.onLine. */
export function useNetworkStatus(): boolean {
  const [offline, setOffline] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine,
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  return offline;
}

/**
 * Removes every app-owned service worker cache. Called on logout so the
 * next signed-in user never finds another member's cached family data.
 */
export async function clearOfflineDataCaches(): Promise<void> {
  if (typeof caches === "undefined") return;
  const names = await caches.keys();
  await Promise.all(
    names
      .filter((name) => name.startsWith(OFFLINE_CACHE_PREFIX))
      .map((name) => caches.delete(name)),
  );
}