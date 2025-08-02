import express, { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';

import { register, login, verifyEmail, resendVerification, refreshToken, getUserProfile, forgotPassword, resetPassword, logout, updateUserProfile } from '../controllers/authController';
import { validate, registerSchema, loginSchema, verifyEmailSchema, resendVerificationSchema, forgotPasswordSchema, resetPasswordSchema } from '../middleware/validate';

import { validateCsrfToken } from '../middleware/csrf';

const router = express.Router();

// Rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per 15 minutes per IP
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 login attempts per 15 minutes per IP
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
});

// Register Route
router.post('/register', authLimiter, validate(registerSchema), validateCsrfToken as RequestHandler, register);

// Sign In Route
router.post('/login', loginLimiter, validateCsrfToken as RequestHandler, validate(loginSchema), login);

// Verify Email Route
router.post('/verify-email', validateCsrfToken as RequestHandler, validate(verifyEmailSchema), verifyEmail);

// Resend Verification Email Route
router.post('/resend-verification', validateCsrfToken as RequestHandler, validate(resendVerificationSchema), resendVerification);

// Refresh Token Route
router.post('/refresh-token', validateCsrfToken as RequestHandler, refreshToken); // CWE-352: Addressed by validateCsrfToken. CWE-1275: Not applicable to this route.

// Get User Profile by Username
router.get('/profile/:username', getUserProfile);

// Update User Profile by Username
router.put('/profile/:username', validateCsrfToken as RequestHandler, updateUserProfile);

// Forgot Password Route
router.post('/forgot-password', validateCsrfToken as RequestHandler, validate(forgotPasswordSchema), forgotPassword);

// Reset Password Route
router.post('/reset-password/:token', validateCsrfToken as RequestHandler, validate(resetPasswordSchema), resetPassword);

// Reset Password Route with token in body
router.post('/reset-password', validateCsrfToken as RequestHandler, validate(resetPasswordSchema), resetPassword);

// Logout Route
router.post('/logout', validateCsrfToken as RequestHandler, logout);

export default router;