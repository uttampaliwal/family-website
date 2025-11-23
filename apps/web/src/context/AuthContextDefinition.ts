import { createContext } from "react";

export interface User {
  id: string;
  name?: string;
  username: string;
  email: string;
  role?: "user" | "admin";
  adminApprovalStatus?: "pending" | "approved" | "rejected";
}

// Define specific types for function arguments
export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  dob: string;
  mobileNumber?: string;
  username: string;
  gender: string;
  relationship?: string;
}

// Define a type for the expected API response on successful auth
export interface AuthApiResponse {
  message: string;
  user: User;
}

export interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<AuthApiResponse>;
  register: (data: RegisterData) => Promise<AuthApiResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>; // To re-fetch user state
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
