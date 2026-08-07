import type { LoginInput, RegisterInput, SafeUser } from "@family/core";
import { create } from "zustand";
import { api, setAuthToken } from "../lib/api-client.js";
import { clearOfflineDataCaches } from "../lib/offline.js";

export type AuthStatus = "loading" | "anonymous" | "authenticated";

interface AuthResponse {
  user: SafeUser;
  accessToken: string;
}

interface PersistedSession {
  accessToken: string;
  user: SafeUser;
}

interface AuthState {
  user: SafeUser | null;
  accessToken: string | null;
  status: AuthStatus;
  init: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-validates a restored session once the network returns. */
  revalidate: () => Promise<void>;
}

let initStarted = false;

const SESSION_KEY = "kulaya.session";

/**
 * The session is kept locally so a previously signed-in member can open the
 * app with no signal and still browse the cached family data. Cleared on
 * logout and when the server rejects the session.
 */
function loadPersistedSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as PersistedSession;
    if (!session.accessToken || !session.user?.id) return null;
    return session;
  } catch {
    return null;
  }
}

function savePersistedSession(session: PersistedSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // storage full or blocked — the session stays memory-only
  }
}

function clearPersistedSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  status: "loading",

  init: async () => {
    if (initStarted) return;
    initStarted = true;
    const persisted = loadPersistedSession();
    try {
      await api.get("/auth/csrf-token");
      const res = await api.post<AuthResponse>("/auth/refresh", {});
      setAuthToken(res.accessToken);
      savePersistedSession({ accessToken: res.accessToken, user: res.user });
      set({ user: res.user, accessToken: res.accessToken, status: "authenticated" });
    } catch {
      if (persisted) {
        // Offline (or the server is unreachable) — serve the saved session.
        setAuthToken(persisted.accessToken);
        set({ user: persisted.user, accessToken: persisted.accessToken, status: "authenticated" });
      } else {
        setAuthToken(null);
        set({ user: null, accessToken: null, status: "anonymous" });
      }
    }
  },

  login: async (input) => {
    const res = await api.post<AuthResponse>("/auth/login", input);
    setAuthToken(res.accessToken);
    savePersistedSession({ accessToken: res.accessToken, user: res.user });
    set({ user: res.user, accessToken: res.accessToken, status: "authenticated" });
  },

  register: async (input) => {
    await api.post("/auth/register", input);
  },

  logout: async () => {
    try {
      await api.post("/auth/logout", {});
    } finally {
      setAuthToken(null);
      clearPersistedSession();
      void clearOfflineDataCaches();
      set({ user: null, accessToken: null, status: "anonymous" });
    }
  },

  revalidate: async () => {
    if (get().status !== "authenticated") return;
    try {
      const res = await api.post<AuthResponse>("/auth/refresh", {});
      setAuthToken(res.accessToken);
      savePersistedSession({ accessToken: res.accessToken, user: res.user });
      set({ user: res.user, accessToken: res.accessToken, status: "authenticated" });
    } catch {
      await get().logout();
    }
  },
}));

// When the network comes back after an offline restore, the session is
// re-validated against the server — and revoked if it expired.
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    void useAuthStore.getState().revalidate();
  });
}
