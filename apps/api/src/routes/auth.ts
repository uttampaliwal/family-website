import express, { RequestHandler as ExpressRequestHandler } from 'express';
import rateLimit from 'express-rate-limit';

import { register, login, verifyEmail, resendVerification, refreshToken, getUserProfile, forgotPassword, resetPassword, logout, updateUserProfile } from '../controllers/authController';
import { validate, registerSchema, loginSchema, verifyEmailSchema, resendVerificationSchema, forgotPasswordSchema, resetPasswordSchema } from '../middleware/validate';

import { csrf } from '../middleware/auth';

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
router.post('/register', csrf as ExpressRequestHandler, authLimiter, validate(registerSchema), register);

// Sign In Route
router.post('/login', csrf as ExpressRequestHandler, loginLimiter, validate(loginSchema), login);

// Verify Email Route
router.post('/verify-email', csrf as ExpressRequestHandler, validate(verifyEmailSchema), verifyEmail);

// Resend Verification Email Route
router.post('/resend-verification', csrf as ExpressRequestHandler, validate(resendVerificationSchema), resendVerification);

// Refresh Token Route
router.post('/refresh-token', csrf as ExpressRequestHandler, refreshToken); // CWE-352: Addressed by validateCsrfToken. CWE-1275: Not applicable to this route.

// Get User Profile by Username
router.get('/profile/:username', (req, res, next) => {
  try {
    getUserProfile(req, res);
  } catch (error) {
    next(error);
  }
});

// Update User Profile by Username
router.put('/profile/:username', csrf as ExpressRequestHandler, updateUserProfile);

// Forgot Password Route
router.post('/forgot-password', csrf as ExpressRequestHandler, validate(forgotPasswordSchema), forgotPassword);

// Reset Password Route
router.post('/reset-password/:token', csrf as ExpressRequestHandler, validate(resetPasswordSchema), resetPassword);

// Reset Password Route with token in body
router.post('/reset-password', csrf as ExpressRequestHandler, validate(resetPasswordSchema), resetPassword);

// Logout Route
router.post('/logout', csrf as ExpressRequestHandler, logout);

export default router;