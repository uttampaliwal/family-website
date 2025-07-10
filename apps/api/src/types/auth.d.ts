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
  token: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token?: string; // Access token
  username?: string;
  accessToken?: string; // New: Access token for login/register responses
  error?: any; // New: For error responses
}

export interface UserProfile {
  username: string;
  email: string;
  name?: string;
  dob?: string;
  mobileNumber?: string | null; // Changed to allow null
  gender?: string;
}