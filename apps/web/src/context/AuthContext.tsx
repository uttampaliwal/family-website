import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../api/axios';

interface AuthContextType {
  isLoggedIn: boolean;
  username: string | null;
  login: (user: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};