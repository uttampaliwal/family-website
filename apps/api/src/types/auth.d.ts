export enum Gender {
  MALE = "male",
  FEMALE = "female",
  PREFER_NOT_TO_SAY = "prefer not to say",
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  dob: string; // ISO date string (YYYY-MM-DD)
  mobileNumber?: string;
  username: string;
  gender: string;
}

export interface LoginRequest {
  identifier: string; // Used by frontend
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
  id: string;
  username: string;
  email: string;
  name?: string;
  dateOfBirth?: string;
  phoneNumber?: string | null;
  gender?: Gender;
  isVerified?: boolean;
}
