export enum Gender {
  MALE = "male",
  FEMALE = "female",
  PREFER_NOT_TO_SAY = "prefer not to say",
}

export enum RelationshipType {
  SELF = "self",
  FATHER = "father",
  MOTHER = "mother",
  SON = "son",
  DAUGHTER = "daughter",
  BROTHER = "brother",
  SISTER = "sister",
  HUSBAND = "husband",
  WIFE = "wife",
  GRANDFATHER = "grandfather",
  GRANDMOTHER = "grandmother",
  UNCLE = "uncle",
  AUNT = "aunt",
  COUSIN = "cousin",
  NEPHEW = "nephew",
  NIECE = "niece",
  SON_IN_LAW = "son-in-law",
  DAUGHTER_IN_LAW = "daughter-in-law",
  BROTHER_IN_LAW = "brother-in-law",
  SISTER_IN_LAW = "sister-in-law",
  OTHER = "other",
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  dob: string; // ISO date string (YYYY-MM-DD)
  mobileNumber?: string;
  username: string;
  gender: string;
  relationship?: RelationshipType;
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
  relationship?: RelationshipType;
  isVerified?: boolean;
}
