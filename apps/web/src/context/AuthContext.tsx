import React, { useState, type ReactNode } from 'react';
import api from '../api/axios';
import { AuthContext, type User } from './AuthContextDefinition';

// Constants for better maintainability
const STORAGE_KEYS = {
  USER: import.meta.env.VITE_USER_KEY || 'user',
  ACCESS_TOKEN: import.meta.env.VITE_ACCESS_TOKEN_KEY || 'accessToken'
} as const;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<{ isLoggedIn: boolean; user: User | null; username: string | null }>((() => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (storedUser && accessToken) {
        const user = JSON.parse(storedUser);
        return { isLoggedIn: true, user, username: user.username };
      }
    } catch (error) {
      console.error('Error reading auth state from localStorage:', error);
    }
    return { isLoggedIn: false, user: null, username: null };
  })());

  const login = (user: User) => {
    if (!user || typeof user !== 'object' || !user.username) {
      throw new Error('Invalid user object provided');
    }
    
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    setAuthState({ isLoggedIn: true, user, username: user.username });
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Don't throw error here as we still want to clear local state
    } finally {
      try {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      } catch (storageError) {
        console.error('Error clearing localStorage:', storageError);
      }
      setAuthState({ isLoggedIn: false, user: null, username: null });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn: authState.isLoggedIn, 
      user: authState.user, 
      username: authState.username,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};