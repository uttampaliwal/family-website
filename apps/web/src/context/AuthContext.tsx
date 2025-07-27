import React, { useState, useEffect, type ReactNode } from 'react';
import api from '../api/axios';
import { AuthContext } from './AuthContextDefinition';

// Constants for better maintainability
const STORAGE_KEYS = {
  USERNAME: 'username',
  ACCESS_TOKEN: 'accessToken'
} as const;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    username: null as string | null
  });

  useEffect(() => {
    const storedUsername = localStorage.getItem(STORAGE_KEYS.USERNAME);
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (storedUsername && accessToken) {
      setAuthState({ isLoggedIn: true, username: storedUsername });
    }
  }, []);

  const login = (user: string) => {
    try {
      if (!user || typeof user !== 'string' || user.trim() === '') {
        throw new Error('Invalid username provided');
      }
      
      const sanitizedUser = user.trim();
      setAuthState({ isLoggedIn: true, username: sanitizedUser });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
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
        localStorage.removeItem(STORAGE_KEYS.USERNAME);
      } catch (storageError) {
        console.error('Error clearing localStorage:', storageError);
      }
      setAuthState({ isLoggedIn: false, username: null });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn: authState.isLoggedIn, 
      username: authState.username, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

