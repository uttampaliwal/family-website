import { createContext } from "react";

export interface User {
  id: string;
  name?: string;
  username: string;
  email: string;
  role?: "user" | "admin";
  adminApprovalStatus?: "pending" | "approved" | "rejected";
}

export interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  username: string | null;
  login: (user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
