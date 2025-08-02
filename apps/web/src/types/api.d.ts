export interface ErrorResponse {
  message: string;
  details?: string;
}

export interface ErrorResponse {
  message: string;
  details?: string;
}

export interface AuthResponse {
  message: string;
  accessToken?: string;
  username?: string;
  user?: UserProfile;
  error?: ErrorResponse;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  name?: string;
  dob?: string;
  mobileNumber?: string | null;
  gender?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  dob: string;
  mobileNumber?: string;
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
  token?: string; // Make token optional since it might be in the URL params
  password: string;
  confirmPassword?: string; // Add confirmPassword for frontend validation
}