import express from 'express';
import { register, login, verifyEmail, resendVerification, refreshToken, getUserProfile, forgotPassword, resetPassword, logout, updateUserProfile } from '../controllers/authController.js';
import { validate, registerSchema, loginSchema, verifyEmailSchema, resendVerificationSchema, forgotPasswordSchema, resetPasswordSchema } from '../middleware/validate.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { csrfProtection } from '../middleware/csrfGenerator.js';
import { authRateLimit, passwordResetRateLimit } from '../middleware/security.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Enhanced logging middleware for auth routes
const authLogger = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: res.statusCode < 400
    };
    
    if (res.statusCode >= 400) {
      logger.warn(logData, 'Authentication request failed');
    } else {
      logger.info(logData, 'Authentication request completed');
    }
  });
  
  next();
};

// Apply auth logging to all routes
router.use(authLogger);

// Register Route - Enhanced with validation and rate limiting
router.post('/register', 
  ...csrfProtection, 
  authRateLimit, 
  validate(registerSchema), 
  register
);

// Sign In Route - Strict rate limiting for login attempts
router.post('/login', 
  ...csrfProtection, 
  authRateLimit, 
  validate(loginSchema), 
  login
);

// Verify Email Route
router.post('/verify-email', 
  ...csrfProtection, 
  authRateLimit, 
  validate(verifyEmailSchema), 
  verifyEmail
);

// Resend Verification Email Route
router.post('/resend-verification', 
  ...csrfProtection, 
  authRateLimit, 
  validate(resendVerificationSchema), 
  resendVerification
);

// Refresh Token Route
router.post('/refresh-token', 
  ...csrfProtection, 
  authRateLimit, 
  refreshToken
);

// Get User Profile by Username - Public endpoint with basic rate limiting
router.get('/profile/:username', 
  authRateLimit,
  (req: express.Request<{ username: string }>, res, next) => {
    try {
      getUserProfile(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Update User Profile by Username - Requires authentication
router.put('/profile/:username', 
  ...csrfProtection, 
  authMiddleware, 
  authRateLimit, 
  updateUserProfile
);

// Forgot Password Route - Very strict rate limiting
router.post('/forgot-password', 
  ...csrfProtection, 
  passwordResetRateLimit, 
  validate(forgotPasswordSchema), 
  forgotPassword
);

// Reset Password Route with token in URL
router.post('/reset-password/:token', 
  ...csrfProtection, 
  passwordResetRateLimit, 
  validate(resetPasswordSchema), 
  resetPassword
);

// Reset Password Route with token in body
router.post('/reset-password', 
  ...csrfProtection, 
  passwordResetRateLimit, 
  validate(resetPasswordSchema), 
  resetPassword
);

// Logout Route
router.post('/logout', 
  ...csrfProtection, 
  authRateLimit, 
  logout
);

export default router;