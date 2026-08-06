import type { LoginInput, RegisterInput, SafeUser } from "@family/core";
import { create } from "zustand";
import { api } from "../lib/api-client.js";

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
}

let initStarted = false;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: "loading",

  init: async () => {
    if (initStarted) return;
    initStarted = true;
    try {
      await api.get("/auth/csrf-token");
      const res = await api.post<AuthResponse>("/auth/refresh", {});
      set({ user: res.user, accessToken: res.accessToken, status: "authenticated" });
    } catch {
      set({ user: null, accessToken: null, status: "anonymous" });
    }
  },

  login: async (input) => {
    const res = await api.post<AuthResponse>("/auth/login", input);
    set({ user: res.user, accessToken: res.accessToken, status: "authenticated" });
  },

  register: async (input) => {
    await api.post("/auth/register", input);
  },

  logout: async () => {
    try {
      await api.post("/auth/logout", {});
    } finally {
      set({ user: null, accessToken: null, status: "anonymous" });
    }
  },
}));
