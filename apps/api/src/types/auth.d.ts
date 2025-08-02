export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  dob: string;
  phoneNumber?: string;
  username: string;
  gender: string;
}

export interface LoginRequest {
  emailOrUsername: string; // More descriptive than 'identifier'
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  emailOrUsername: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token?: string; // Make token optional since it might be in the URL params
  password: string;
}

// Error response interface for better type safety
export interface AuthError {
  message: string;
  code?: string;
  details?: string;
}

export interface AuthResponse {
  message: string;
  accessToken?: string; // Consolidated access token property
  username?: string;
  error?: AuthError; // Properly typed error responses
}

export interface UserProfile {
  username: string;
  email: string;
  name?: string;
  dob?: string;
  phoneNumber?: string | null; // Changed to allow null
  gender?: string;
}