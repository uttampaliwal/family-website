import axios from 'axios';
import api from './axios';

// --- COPIED INTERFACE DEFINITIONS START ---
export interface ErrorResponse {
  message: string;
  details?: string;
}

export interface AuthResponse {
  message: string;
  accessToken?: string;
  username?: string;
  user?: UserProfile;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  name?: string;
  dateOfBirth?: string;
  phoneNumber?: string | null;
  mobileNumber?: string | null;
  gender?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  dateOfBirth: string;
  phoneNumber?: string;
  username: string;
  gender: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  identifier: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token?: string;
  password: string;
  confirmPassword?: string;
}
// --- COPIED INTERFACE DEFINITIONS END ---


const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY || 'accessToken';
const USERNAME_KEY = import.meta.env.VITE_USERNAME_KEY || 'username';

export const register = async (data: RegisterRequest): Promise<UserProfile> => {
  const response = await api.post<UserProfile>('/auth/register', data);
  return response.data;
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', data);
  if (response.data.accessToken) {
    if (response.data.user) {
      localStorage.setItem(ACCESS_TOKEN_KEY, response.data.accessToken);
      localStorage.setItem(USERNAME_KEY, response.data.user.username);
    } else {
      console.error('Login successful, but user data is missing from response.');
    }
  }
  return response.data;
};

export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout failed, proceeding to clear local data.', error);
  } finally {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
  }
};

export const forgotPassword = async (email: string) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Failed to send password reset link.');
    }
    throw new Error('An unexpected error occurred.');
  }
};

export const resetPassword = async (password: string, token: string) => {
  const response = await api.post(`/auth/reset-password/${token}`, { password });
  return response.data;
};

export const verifyEmail = async (token: string) => {
  const response = await api.get(`/auth/verify-email/${token}`);
  return response.data;
};

export const fetchUserProfile = async (username: string): Promise<UserProfile> => {
  const response = await api.get<UserProfile>(`/auth/profile/${username}`);
  return response.data;
};

export const updateUserProfile = async (username: string, data: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await api.put<UserProfile>(`/auth/profile/${username}`, data);
  return response.data;
};
