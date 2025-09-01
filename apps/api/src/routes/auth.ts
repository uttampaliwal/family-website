import express from "express";
import {
  register,
  login,
  verifyEmail,
  resendVerification,
  refreshToken,
  getUserProfile,
  forgotPassword,
  resetPassword,
  logout,
  changePassword,
  updateUserProfile,
  checkUsernameAvailability,
} from "../controllers/authController.js";
import passport from "../config/passport.js";
import {
  validate,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../middleware/validate.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  csrfProtection,
  generateCsrfToken,
} from "../middleware/csrfGenerator.js";
import {
  authRateLimit,
  passwordResetRateLimit,
} from "../middleware/security.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

// Enhanced logging middleware for auth routes
const authLogger = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      success: res.statusCode < 400,
    };

    if (res.statusCode >= 400) {
      logger.warn(logData, "Authentication request failed");
    } else {
      logger.info(logData, "Authentication request completed");
    }
  });

  next();
};

// Apply auth logging to all routes
router.use(authLogger);

// CSRF Token endpoint - GET request to generate and return CSRF token
router.get("/csrf-token", generateCsrfToken, (req, res) => {
  // The CSRF token is already set in the cookie by the middleware
  res.json({
    message: "CSRF token generated",
    token: req.cookies?.["XSRF-TOKEN"] || null,
  });
});

// Register Route - Enhanced with validation and rate limiting
router.post(
  "/register",
  ...csrfProtection,
  authRateLimit,
  validate(registerSchema),
  register,
);

// Sign In Route - Strict rate limiting for login attempts
router.post(
  "/login",
  ...csrfProtection,
  authRateLimit,
  validate(loginSchema),
  login,
);

// Verify Email Route
router.post(
  "/verify-email",
  ...csrfProtection,
  authRateLimit,
  validate(verifyEmailSchema),
  verifyEmail,
);

// Resend Verification Email Route
router.post(
  "/resend-verification",
  ...csrfProtection,
  authRateLimit,
  validate(resendVerificationSchema),
  resendVerification,
);

// Refresh Token Route
router.post("/refresh-token", ...csrfProtection, authRateLimit, refreshToken);

// Check Username Availability - Public endpoint
router.get(
  "/check-username/:username",
  authRateLimit,
  checkUsernameAvailability,
);

// Get User Profile by Username - Public endpoint with basic rate limiting
router.get(
  "/profile/:username",
  authMiddleware,
  authRateLimit,
  (req: express.Request<{ username: string }>, res, next) => {
    try {
      getUserProfile(req, res);
    } catch (error) {
      next(error);
    }
  },
);

// Update User Profile by Username - Requires authentication
router.put(
  "/profile/:username",
  ...csrfProtection,
  authMiddleware,
  authRateLimit,
  updateUserProfile,
);

// Forgot Password Route - Very strict rate limiting
router.post(
  "/forgot-password",
  ...csrfProtection,
  passwordResetRateLimit,
  validate(forgotPasswordSchema),
  forgotPassword,
);

// Reset Password Route with token in body
router.post(
  "/reset-password",
  ...csrfProtection,
  passwordResetRateLimit,
  validate(resetPasswordSchema),
  resetPassword,
);

// Logout Route
router.post("/logout", ...csrfProtection, authRateLimit, logout);

// Change password (authenticated user)
router.post(
  "/change-password",
  ...csrfProtection,
  authMiddleware,
  authRateLimit,
  validate(changePasswordSchema),
  changePassword,
);

// OAuth Routes

// GitHub OAuth
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] }),
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/login?error=github_auth_failed",
  }),
  (req, res) => {
    // Successful authentication, redirect to frontend with success
    if (!req.user) {
      return res.redirect("/login?error=authentication_failed");
    }
    const user = req.user;
    const redirectUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(
      `${redirectUrl}/auth/success?provider=github&user=${encodeURIComponent(
        JSON.stringify({
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
        }),
      )}`,
    );
  },
);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login?error=google_auth_failed",
  }),
  (req, res) => {
    // Successful authentication, redirect to frontend with success
    if (!req.user) {
      return res.redirect("/login?error=authentication_failed");
    }
    const user = req.user;
    const redirectUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(
      `${redirectUrl}/auth/success?provider=google&user=${encodeURIComponent(
        JSON.stringify({
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
        }),
      )}`,
    );
  },
);

export default router;
