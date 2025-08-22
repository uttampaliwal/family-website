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
  token?: string; // Make token optional since it might be in the URL params
  password: string;
  confirmPassword?: string; // Add confirmPassword for frontend validation
}
