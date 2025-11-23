import express from "express";
import {
  register,
  login,
  verifyEmail,
  resendVerification,
  getMe,
  getUserProfile,
  forgotPassword,
  resetPassword,
  logout,
  changePassword,
  updateUserProfile,
  checkUsernameAvailability,
} from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";
import passport from "../config/passport";
import {
  validate,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../middleware/validate";
import { csrfProtection, generateCsrfToken } from "../middleware/csrfGenerator";
import { apiRateLimit, authRateLimit } from "../middleware/enhancedSecurity";
import { passwordResetRateLimit } from "../middleware/security";
import { logger } from "../utils/logger";

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

// CSRF Token endpoint
router.get("/csrf-token", generateCsrfToken, (req, res) => {
  res.json({
    message: "CSRF token generated",
    token: req.cookies?.["XSRF-TOKEN"] || null,
  });
});

// Register Route - Strict rate limit
router.post(
  "/register",
  ...csrfProtection,
  authRateLimit,
  validate(registerSchema),
  register,
);

// Sign In Route - Strict rate limit
router.post(
  "/login",
  ...csrfProtection,
  authRateLimit,
  validate(loginSchema),
  login,
);

// Verify Email Route - General rate limit
router.post(
  "/verify-email",
  ...csrfProtection,
  apiRateLimit,
  validate(verifyEmailSchema),
  verifyEmail,
);

// Resend Verification Email Route - General rate limit
router.post(
  "/resend-verification",
  ...csrfProtection,
  apiRateLimit,
  validate(resendVerificationSchema),
  resendVerification,
);

// New route to get current user data - General rate limit
router.get("/me", apiRateLimit, protect, getMe);

// Check Username Availability - General rate limit
router.get(
  "/check-username/:username",
  apiRateLimit,
  checkUsernameAvailability,
);

// Get User Profile by Username - General rate limit
router.get(
  "/profile/:username",
  protect,
  apiRateLimit,
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
  protect,
  apiRateLimit,
  updateUserProfile,
);

// Forgot Password Route - Very strict rate limit
router.post(
  "/forgot-password",
  ...csrfProtection,
  passwordResetRateLimit,
  validate(forgotPasswordSchema),
  forgotPassword,
);

// Reset Password Route - Very strict rate limit
router.post(
  "/reset-password",
  ...csrfProtection,
  passwordResetRateLimit,
  validate(resetPasswordSchema),
  resetPassword,
);

// Logout Route - General rate limit
router.post("/logout", ...csrfProtection, apiRateLimit, logout);

// Change password (authenticated user) - General rate limit
router.post(
  "/change-password",
  ...csrfProtection,
  protect,
  apiRateLimit,
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
