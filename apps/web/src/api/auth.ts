import api from './axios';
import type { AuthResponse, ResetPasswordRequest, ForgotPasswordRequest } from '../types/api';

export const resetPassword = async (data: ResetPasswordRequest): Promise<AuthResponse> => {
  if (!data || typeof data !== 'object') {
    throw new Error('Reset password data is required');
  }
  
  if (!data.token || typeof data.token !== 'string' || data.token.trim() === '') {
    throw new Error('Reset token is required');
  }
  
  const minPasswordLength = parseInt(import.meta.env.VITE_MIN_PASSWORD_LENGTH || import.meta.env.VITE_DEFAULT_MIN_PASSWORD_LENGTH || '8', 10);
  if (!data.password || typeof data.password !== 'string' || data.password.length < minPasswordLength) {
    throw new Error('Valid password is required');
  }
  
  try {
    const response = await api.post<AuthResponse>('/api/auth/reset-password', data);
    
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Invalid response from server');
    }
    
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to reset password');
  }
};

export const forgotPassword = async (data: ForgotPasswordRequest): Promise<AuthResponse> => {
  if (!data || typeof data !== 'object') {
    throw new Error('Forgot password data is required');
  }
  
  if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
    throw new Error('Valid email is required');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email.trim())) {
    throw new Error('Valid email is required');
  }
  
  try {
    const response = await api.post<AuthResponse>('/api/auth/forgot-password', data);
    
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Invalid response from server');
    }
    
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to send password reset email');
  }
};