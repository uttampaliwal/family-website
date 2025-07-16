import React, { useState, useEffect, type ReactNode } from 'react';
import api from '../api/axios';
import { AuthContext } from './AuthContextDefinition';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const accessToken = localStorage.getItem('accessToken');
    if (storedUsername && accessToken) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    }
  }, []);

  const login = (user: string) => {
    setIsLoggedIn(true);
    setUsername(user);
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('username');
      setIsLoggedIn(false);
      setUsername(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

