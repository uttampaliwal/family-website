import React, { useState, type ReactNode, useEffect, useCallback } from "react";
import api from "../services/axios";
import { AuthContext, type User } from "./AuthContextDefinition";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get("/api/auth/me");
      if (data) {
        setUser(data);
        setIsLoggedIn(true);
      }
    } catch {
      setUser(null);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials: object) => {
    const response = await api.post("/api/auth/login", credentials);
    await checkAuth();
    return response;
  };

  const register = async (data: object) => {
    const response = await api.post("/api/auth/register", data);
    await checkAuth();
    return response;
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Fail silently, as the client-side state will be cleared anyway.
    }
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        user,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
