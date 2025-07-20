import api from './axios';
import type { AuthResponse, ResetPasswordRequest, ForgotPasswordRequest } from '../types/api';

export const resetPassword = async (data: ResetPasswordRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/auth/reset-password', data);
  return response.data;
};

export const forgotPassword = async (data: ForgotPasswordRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/auth/forgot-password', data);
  return response.data;
};