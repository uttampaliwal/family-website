import { createContext } from 'react';

export interface AuthContextType {
  isLoggedIn: boolean;
  username: string | null;
  login: (user: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
