import express from 'express';
import rateLimit from 'express-rate-limit';

import { register, login, verifyEmail, resendVerification, refreshToken, getUserProfile, forgotPassword, resetPassword, logout, updateUserProfile } from '../controllers/authController.js';
import { validate, registerSchema, loginSchema, verifyEmailSchema, resendVerificationSchema, forgotPasswordSchema, resetPasswordSchema } from '../middleware/validate.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { csrfProtection } from '../middleware/csrfGenerator.js';

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

const authActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requests per 15 minutes per IP for other auth actions
  message: 'Too many requests for this action from your IP, please try again after 15 minutes',
});

// Register Route
router.post('/register', ...csrfProtection, authLimiter, validate(registerSchema), register);

// Sign In Route
router.post('/login', ...csrfProtection, loginLimiter, validate(loginSchema), login);

// Verify Email Route
router.post('/verify-email', ...csrfProtection, authActionLimiter, validate(verifyEmailSchema), verifyEmail);

// Resend Verification Email Route
router.post('/resend-verification', ...csrfProtection, authActionLimiter, validate(resendVerificationSchema), resendVerification);

// Refresh Token Route
router.post('/refresh-token', ...csrfProtection, authActionLimiter, refreshToken);

// Get User Profile by Username
router.get('/profile/:username', (req, res, next) => {
  try {
    getUserProfile(req, res);
  } catch (error) {
    next(error);
  }
});

// Update User Profile by Username
router.put('/profile/:username', ...csrfProtection, authMiddleware, authActionLimiter, updateUserProfile);

// Forgot Password Route
router.post('/forgot-password', ...csrfProtection, authActionLimiter, validate(forgotPasswordSchema), forgotPassword);

// Reset Password Route
router.post('/reset-password/:token', ...csrfProtection, authActionLimiter, validate(resetPasswordSchema), resetPassword);

// Reset Password Route with token in body
router.post('/reset-password', ...csrfProtection, authActionLimiter, validate(resetPasswordSchema), resetPassword);

// Logout Route
router.post('/logout', ...csrfProtection, authActionLimiter, logout);

export default router;