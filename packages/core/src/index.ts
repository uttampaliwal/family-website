export {
  email,
  name,
  password,
  phoneNumber,
  username,
  objectId,
  dateOfBirth,
  pageSize,
  pageIndex,
} from "./schemas/common.js";

export {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  userSchema,
  authResponseSchema,
} from "./schemas/auth.js";

export type {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
  User,
  SafeUser,
  AuthResponse,
} from "./schemas/auth.js";