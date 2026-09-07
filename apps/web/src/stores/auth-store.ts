import type { LoginInput, RegisterInput, SafeUser } from "@family/core";
import { create } from "zustand";
import { ApiError, api, setAuthToken } from "../lib/api-client.js";
import { clearOfflineDataCaches } from "../lib/offline.js";

export type AuthStatus = "loading" | "anonymous" | "authenticated";

interface AuthResponse {
  user: SafeUser;
  accessToken: string;
}

interface AuthState {
  user: SafeUser | null;
  accessToken: string | null;
  status: AuthStatus;
  init: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-validates the session once the network returns. */
  revalidate: () => Promise<void>;
}

let initStarted = false;

/** Pre-P1 localStorage key that held the access JWT — wiped once, never written. */
const LEGACY_SESSION_KEY = "kulaya.session";

/**
 * One-time migration: delete any persisted session left by older builds.
 * Merely stopping future writes would leave live credentials in existing
 * browsers, so the key is actively removed on every boot.
 */
function wipeLegacyPersistedSession(): void {
  try {
    localStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    // storage blocked — nothing persisted anyway
  }
}

/**
 * Single-flight refresh: concurrent callers (StrictMode double-init,
 * reconnect bursts, multi-tab same-tab races) share one in-flight request
 * instead of stampeding the rotation endpoint and tripping reuse detection.
 */
let refreshPromise: Promise<AuthResponse> | null = null;

async function refreshSession(): Promise<AuthResponse> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        await api.get("/auth/csrf-token");
        return await api.post<AuthResponse>("/auth/refresh", {});
      } catch (err) {
        // Losing side of a multi-tab race: our presented token was already
        // superseded, but the shared cookie has since rotated — retry once
        // with the current cookie instead of logging the user out.
        if (err instanceof ApiError && err.code === "SESSION_ROTATED") {
          await api.get("/auth/csrf-token");
          return await api.post<AuthResponse>("/auth/refresh", {});
        }
        throw err;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

function applySession(
  set: (state: Partial<AuthState>) => void,
  res: AuthResponse,
): void {
  // Memory-only: the access token is never written to localStorage,
  // sessionStorage, or the service-worker cache (see online-first policy).
  setAuthToken(res.accessToken);
  set({
    user: res.user,
    accessToken: res.accessToken,
    status: "authenticated",
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  status: "loading",

  init: async () => {
    if (initStarted) return;
    initStarted = true;
    wipeLegacyPersistedSession();
    try {
      applySession(set, await refreshSession());
    } catch {
      // No network or no session: online-first means anonymous — the app
      // shell renders with an offline notice instead of stale family data.
      setAuthToken(null);
      set({ user: null, accessToken: null, status: "anonymous" });
    }
  },

  login: async (input) => {
    const res = await api.post<AuthResponse>("/auth/login", input);
    applySession(set, res);
  },

  register: async (input) => {
    await api.post("/auth/register", input);
  },

  logout: async () => {
    try {
      await api.post("/auth/logout", {});
    } finally {
      setAuthToken(null);
      wipeLegacyPersistedSession();
      void clearOfflineDataCaches();
      set({ user: null, accessToken: null, status: "anonymous" });
    }
  },

  revalidate: async () => {
    if (get().status !== "authenticated") return;
    try {
      applySession(set, await refreshSession());
    } catch {
      await get().logout();
    }
  },
}));

// When the network comes back, the session is re-validated against the
// server — and revoked if it expired.
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    void useAuthStore.getState().revalidate();
  });
}
