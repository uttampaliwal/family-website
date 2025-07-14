import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, verifyEmail, resendVerification, refreshToken, getUserProfile, forgotPassword, resetPassword, logout, updateUserProfile } from '../controllers/authController';
import { validate, registerSchema, loginSchema, verifyEmailSchema, resendVerificationSchema, forgotPasswordSchema, resetPasswordSchema } from '../middleware/validate';

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
router.post('/register', authLimiter, validate(registerSchema), register as RequestHandler);

// Sign In Route
router.post('/login', loginLimiter, validate(loginSchema), login as RequestHandler);

// Verify Email Route
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail as RequestHandler);

// Resend Verification Email Route
router.post('/resend-verification', validate(resendVerificationSchema), resendVerification as RequestHandler);

// Refresh Token Route
router.post('/refresh-token', refreshToken as RequestHandler);

// Get User Profile by Username
router.get('/profile/:username', getUserProfile as RequestHandler<{ username: string }>);

// Update User Profile by Username
router.put('/profile/:username', updateUserProfile as RequestHandler<{ username: string }>);

// Forgot Password Route
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword as RequestHandler);

// Reset Password Route
router.post('/reset-password/:token', validate(resetPasswordSchema), resetPassword as RequestHandler<{ token: string }>);

// Logout Route
router.post('/logout', logout as RequestHandler);

export default router;