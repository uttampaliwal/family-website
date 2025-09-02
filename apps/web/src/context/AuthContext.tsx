import React, { useState, type ReactNode } from "react";
import api from "../services/axios";
import { AuthContext, type User } from "./AuthContextDefinition";

// Constants for better maintainability
const STORAGE_KEYS = {
  USER: import.meta.env.VITE_USER_KEY || "user",
  ACCESS_TOKEN: import.meta.env.VITE_ACCESS_TOKEN_KEY || "accessToken",
} as const;

const getInitialAuthState = () => {
  try {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (storedUser && accessToken) {
      const user = JSON.parse(storedUser);
      return {
        isLoggedIn: true,
        user,
        username: user.username,
        token: accessToken,
      };
    }
  } catch {
    if (import.meta.env.DEV) {
      // Error reading auth state from localStorage - handle silently
    }
  }
  return { isLoggedIn: false, user: null, username: null, token: null };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState(getInitialAuthState);

  const login = (user: User, token: string) => {
    if (!user || typeof user !== "object" || !user.username) {
      throw new Error("Invalid user object provided");
    }

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    setAuthState({ isLoggedIn: true, user, username: user.username, token });
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Logout API call failed - handle silently
      // Don't throw error here as we still want to clear local state
    } finally {
      try {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      } catch {
        // Error clearing localStorage - handle silently
      }
      setAuthState({
        isLoggedIn: false,
        user: null,
        username: null,
        token: null,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: authState.isLoggedIn,
        user: authState.user,
        username: authState.username,
        token: authState.token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
