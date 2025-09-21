import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
// Switched to enhanced email service with URL validation and retry
import { sendEmailWithRetry } from "../utils/enhancedEmailService";
import {
  createEmailVerificationTemplate,
  createPasswordResetTemplate,
  createPasswordChangeConfirmationTemplate,
} from "../utils/emailContent";
import { createSafeEmailUrl } from "../utils/urlValidator";
import User, { IUser } from "../models/User";
import type {
  RegisterRequest,
  LoginRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  UserProfile,
} from "../types/auth";
import { Gender, RelationshipType } from "../types/auth.enums";
import { sanitizeLog } from "../utils/logSanitizer";
import { logError, logWarn } from "../utils/logger";

const jwtSecret = process.env.JWT_SECRET as string;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET as string;

// Validate JWT secrets on startup
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long");
}
if (!refreshTokenSecret || refreshTokenSecret.length < 32) {
  throw new Error("REFRESH_TOKEN_SECRET must be at least 32 characters long");
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

import { htmlEncode } from "../utils/sanitization.js";

export const register = async (
  req: Request<Record<string, never>, Record<string, never>, RegisterRequest>,
  res: Response<AuthResponse>,
): Promise<Response<AuthResponse>> => {
  const { name, email, password, dob, username, mobileNumber, relationship } =
    req.body;
  const gender = req.body.gender as Gender;

  try {
    // Sanitize email input to prevent NoSQL injection
    const sanitizedEmail = sanitizeForQuery(email);
    let user = await User.findOne<IUser>({ email: sanitizedEmail });
    if (user) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Check username availability
    const sanitizedUsername = sanitizeForQuery(username);
    user = await User.findOne<IUser>({ username: sanitizedUsername });
    if (user) {
      return res
        .status(400)
        .json({ message: "Username is already taken. Please choose another." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto
      .randomBytes(20)
      .toString("hex")
      .toLowerCase();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user = new User({
      name,
      email,
      password: hashedPassword,
      dateOfBirth: new Date(dob),
      phoneNumber: mobileNumber,
      username,
      gender: gender.toLowerCase(),
      relationship: relationship?.toLowerCase(),
      verificationToken,
      verificationTokenExpires,
      auditLog: [{ event: "User account created" }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await user.save();

    // Send admin notification email
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const adminNotificationTemplate = {
        subject: "New User Registration Requires Approval",
        html: `<p>A new user, ${name} (@${username}), has registered.</p><p>Please review their details and approve or reject their access.</p>`,
        text: `A new user, ${name} (@${username}), has registered. Please review their details and approve or reject their access.`,
      };
      sendEmailWithRetry({
        to: adminEmail,
        subject: adminNotificationTemplate.subject,
        html: adminNotificationTemplate.html,
        text: adminNotificationTemplate.text,
      }).catch((err) =>
        logError(err as Error, "admin_notification_email", { userId: user.id }),
      ); // Log error but don't block registration
    }

    // Send verification email using templates and enhanced service
    const { url: safeVerificationUrl, isValid } = await createSafeEmailUrl(
      process.env.FRONTEND_URL || "",
      "/verify-email",
      { token: verificationToken },
    );
    const finalVerificationUrl = isValid
      ? safeVerificationUrl
      : `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const verificationEmail = createEmailVerificationTemplate(
      finalVerificationUrl,
      {
        recipientName: name,
        supportEmail: process.env.EMAIL_USER || "support@familywebsite.com",
      },
    );

    const sendResult = await sendEmailWithRetry({
      to: email,
      subject: verificationEmail.subject,
      html: verificationEmail.html,
      text: verificationEmail.text,
      validateUrls: true,
    });

    if (!sendResult.success) {
      logWarn("Verification email failed to send", {
        error: sanitizeLog(sendResult.error || "Unknown error"),
        userId: user.id,
        operation: "send_verification_email",
      });
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      {
        id: user.id,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString("hex"),
      },
      jwtSecret,
      {
        expiresIn: "15m",
        algorithm: "HS512",
        issuer: "family-website",
        audience: "family-website-users",
      },
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString("hex"),
      },
      refreshTokenSecret,
      {
        expiresIn: "7d",
        algorithm: "HS512",
        issuer: "family-website",
        audience: "family-website-users",
      },
    );

    await User.updateOne(
      { _id: user._id },
      {
        $push: {
          refreshTokens: { $each: [refreshToken], $slice: -5 },
        },
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 },
      },
      { runValidators: false },
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(201).json({
      message:
        "User registered successfully. Please check your email for verification.",
      accessToken: accessToken,
      username: htmlEncode(user.username),
    });
  } catch (error) {
    // Registration error - handle with structured logging
    logError(error as Error, "user_registration", {
      email: sanitizeLog(email),
      username: sanitizeLog(username),
    });
    return res
      .status(500)
      .json({ message: "Registration failed. Please try again later." });
  }
};

const sanitizeForQuery = (input: string) => {
  // Allow alphanumeric, @, ., -, _, and + for emails and usernames
  return input.replace(/[^a-zA-Z0-9@.\-_+]/g, "");
};

export const login = async (
  req: Request<Record<string, never>, Record<string, never>, LoginRequest>,
  res: Response<AuthResponse>,
): Promise<Response<AuthResponse>> => {
  const { identifier, password } = req.body;

  // Input validation
  if (!identifier || !password) {
    return res.status(400).json({
      message: "Email/username and password are required",
    });
  }

  if (typeof identifier !== "string" || typeof password !== "string") {
    return res.status(400).json({
      message: "Invalid input format",
    });
  }

  if (identifier.trim().length === 0 || password.length === 0) {
    return res.status(400).json({
      message: "Email/username and password cannot be empty",
    });
  }

  try {
    const sanitizedIdentifier = sanitizeForQuery(identifier);
    const user = await User.findOne<IUser>({
      $or: [{ email: sanitizedIdentifier }, { username: sanitizedIdentifier }],
    });
    if (!user) {
      return res.status(400).json({
        message:
          "No account found with that email or username. Please register.",
      });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({
        message: "Account is temporarily locked. Please try again later.",
      });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your email before logging in." });
    }

    if (user.role !== "admin" && user.adminApprovalStatus !== "approved") {
      return res
        .status(403)
        .json({ message: "Account not approved by administrator." });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const newAttempts = (user.loginAttempts || 0) + 1;
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              loginAttempts: newAttempts,
              lockUntil: Date.now() + LOCK_TIME,
            },
          },
          { runValidators: false },
        );
        return res.status(403).json({
          message: `Too many failed login attempts. Account locked for ${LOCK_TIME / (1000 * 60 * 60)} hours.`,
        });
      }
      await User.updateOne(
        { _id: user._id },
        { $set: { loginAttempts: newAttempts } },
        { runValidators: false },
      );
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // JWT secret is validated at startup
    const accessToken = jwt.sign(
      {
        id: user.id,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString("hex"),
      },
      jwtSecret,
      {
        expiresIn: "15m",
        algorithm: "HS512",
        issuer: "family-website",
        audience: "family-website-users",
      },
    );
    // Refresh token secret is validated at startup
    const refreshToken = jwt.sign(
      {
        id: user.id,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString("hex"),
      },
      refreshTokenSecret,
      {
        expiresIn: "7d",
        algorithm: "HS512",
        issuer: "family-website",
        audience: "family-website-users",
      },
    );
    await User.updateOne(
      { _id: user._id },
      {
        $push: { refreshTokens: { $each: [refreshToken], $slice: -5 } },
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 },
      },
      { runValidators: false },
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      message: "Logged in successfully",
      accessToken: accessToken,
      username: htmlEncode(user.username),
      user: {
        id: user._id.toString(),
        name: htmlEncode(user.name),
        username: htmlEncode(user.username),
        email: htmlEncode(user.email),
        role: user.role,
        adminApprovalStatus: user.adminApprovalStatus,
      },
    });
  } catch (err) {
    const errorObject = err as Error & { stack?: string };
    // Log full error for diagnostics during development
    logError(errorObject, "user_login", {
      identifier: sanitizeLog(identifier),
      hasStack: !!errorObject?.stack,
    });

    const message =
      process.env.NODE_ENV === "development"
        ? `Login failed: ${errorObject?.message || "Unknown error"}`
        : "An error occurred during login.";

    return res.status(500).json({ message });
  }
};

export const verifyEmail = async (
  req: Request<
    Record<string, never>,
    Record<string, never>,
    VerifyEmailRequest
  >,
  res: Response<AuthResponse>,
): Promise<Response<AuthResponse>> => {
  const { token } = req.body;

  try {
    // Validate token format before querying database
    if (
      !token ||
      typeof token !== "string" ||
      !/^[a-fA-F0-9]{40}$/.test(token)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid verification token format." });
    }

    // Normalize token to lowercase for consistent database lookup
    const normalizedToken = token.toLowerCase();

    // Find user by token
    const user = await User.findOne<IUser>({
      verificationToken: normalizedToken,
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token." });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res
        .status(400)
        .json({ message: "Email is already verified. Please log in." });
    }

    // Check if token has expired
    if (
      user.verificationTokenExpires &&
      user.verificationTokenExpires < new Date()
    ) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token." });
    }

    // Update user verification status
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return res
      .status(200)
      .json({ message: "Email verified successfully! You can now sign in." });
  } catch (error) {
    // Email verification error - handle with structured logging
    logError(error as Error, "email_verification", {
      token: sanitizeLog(token),
    });
    return res
      .status(500)
      .json({ message: "Email verification failed. Please try again later." });
  }
};

export const resendVerification = async (
  req: Request<
    Record<string, never>,
    Record<string, never>,
    ResendVerificationRequest
  >,
  res: Response<AuthResponse>,
): Promise<Response<AuthResponse>> => {
  const { identifier } = req.body;

  try {
    // Sanitize input to prevent NoSQL injection
    if (typeof identifier !== "string" || !identifier.trim()) {
      return res
        .status(400)
        .json({ message: "Invalid email or username format" });
    }

    // Sanitize the input to prevent NoSQL injection
    const sanitizedInput = String(identifier).trim();

    const user = await User.findOne<IUser>({
      $or: [{ email: sanitizedInput }, { username: sanitizedInput }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (user.isVerified) {
      return res
        .status(400)
        .json({ message: "Email already verified. Please log in." });
    }

    // Generate a new verification token with expiration for resend
    const verificationToken = crypto
      .randomBytes(20)
      .toString("hex")
      .toLowerCase();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    // Build and validate verification URL, then send using template
    const { url: safeVerificationUrl, isValid } = await createSafeEmailUrl(
      process.env.FRONTEND_URL || "",
      "/verify-email",
      { token: verificationToken },
    );
    const finalVerificationUrl = isValid
      ? safeVerificationUrl
      : `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const verificationEmail = createEmailVerificationTemplate(
      finalVerificationUrl,
      {
        recipientName: user.name,
        supportEmail: process.env.EMAIL_USER || "support@familywebsite.com",
      },
    );

    await sendEmailWithRetry({
      to: user.email,
      subject: verificationEmail.subject,
      html: verificationEmail.html,
      text: verificationEmail.text,
      validateUrls: true,
    });

    return res.status(200).json({
      message: "Verification email sent successfully. Please check your inbox.",
    });
  } catch {
    // Resend verification email error - handle with structured logging
    return res.status(500).json({
      message: "Failed to resend verification email. Please try again later.",
    });
  }
};

export const refreshToken = async (
  req: Request,
  res: Response<AuthResponse>,
): Promise<Response<AuthResponse>> => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided." });
  }
  try {
    // Refresh token secret is validated at startup
    const decoded = jwt.verify(refreshToken, refreshTokenSecret) as {
      id: string;
    };
    const user = await User.findById<IUser>(String(decoded.id));

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(403).json({ message: "Invalid refresh token." });
    }
    // JWT secret is validated at startup
    const newAccessToken = jwt.sign(
      {
        id: user.id,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString("hex"),
      },
      jwtSecret,
      {
        expiresIn: "15m",
        algorithm: "HS512",
        issuer: "family-website",
        audience: "family-website-users",
      },
    );

    const newRefreshToken = jwt.sign(
      {
        id: user.id,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString("hex"),
      },
      refreshTokenSecret,
      {
        expiresIn: "7d",
        algorithm: "HS512",
        issuer: "family-website",
        audience: "family-website-users",
      },
    );
    user.refreshTokens.push(newRefreshToken);
    await user.save();
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return res.status(200).json({
      accessToken: newAccessToken,
      message: "Token refreshed successfully.",
    });
  } catch {
    // Refresh token error - handle with structured logging
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token." });
  }
};

export const getUserProfile = async (
  req: Request<{ username: string }>,
  res: Response<UserProfile | AuthResponse>,
): Promise<Response<UserProfile | AuthResponse>> => {
  try {
    // Prevent NoSQL injection by using exact string comparison
    const username = String(req.params.username);
    const user = await User.findOne<IUser>({ username: username }).select(
      "-password -verificationToken",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    // Sanitize user data before returning to prevent XSS
    const sanitizedUser: UserProfile = {
      id: user._id.toString(),
      name: htmlEncode(user.name || ""),
      username: htmlEncode(user.username || ""),
      email: htmlEncode(user.email || ""),
      dateOfBirth: user.dateOfBirth
        ? user.dateOfBirth.toISOString().split("T")[0]
        : undefined,
      phoneNumber: user.phoneNumber ? htmlEncode(user.phoneNumber) : undefined,
      gender: user.gender as Gender,
      relationship: user.relationship as RelationshipType | undefined,
      isVerified: user.isVerified,
    };

    return res.status(200).json(sanitizedUser);
  } catch (error) {
    // Error fetching user profile - handle with structured logging
    logError(error as Error, "get_user_profile", {
      username: sanitizeLog(req.params.username || "unknown"),
    });
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
};

export const forgotPassword = async (
  req: Request<
    Record<string, never>,
    Record<string, never>,
    ForgotPasswordRequest
  >,
  res: Response<AuthResponse>,
): Promise<Response<AuthResponse>> => {
  const { email } = req.body;

  try {
    if (typeof email !== "string") {
      return res.status(400).json({ message: "Invalid email format" });
    }
    const sanitizedEmail = sanitizeForQuery(email);
    const user = await User.findOne<IUser>({ email: sanitizedEmail });

    // If user exists, proceed with token generation and email sending
    if (user) {
      // Generate a secure random token and hash it for storage
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

      await user.save();

      // Build validated reset URL and use email template + enhanced sender
      const { url: safeResetUrl, isValid } = await createSafeEmailUrl(
        process.env.FRONTEND_URL || "",
        "/reset-password",
        {},
      );
      const finalResetUrl = isValid
        ? safeResetUrl
        : `${process.env.FRONTEND_URL}/reset-password`;

      const resetEmail = createPasswordResetTemplate(
        finalResetUrl,
        resetToken,
        {
          recipientName: user.name,
          supportEmail: process.env.EMAIL_USER || "support@familywebsite.com",
        },
      );

      await sendEmailWithRetry({
        to: user.email,
        subject: resetEmail.subject,
        html: resetEmail.html,
        text: resetEmail.text,
        validateUrls: true,
      });
    }

    // Always return a generic success message to prevent user enumeration
    return res
      .status(200)
      .json({ message: "Password reset link sent to your email." });
  } catch (err: unknown) {
    logError(err as Error, "forgot_password", {
      email: sanitizeLog(email),
    });
    return res
      .status(500)
      .json({ message: "Error sending password reset email." });
  }
};

export const resetPassword = async (
  req: Request<{ token?: string }, Record<string, never>, ResetPasswordRequest>,
  res: Response<AuthResponse>,
): Promise<Response<AuthResponse>> => {
  // Get token from either params or body
  const tokenFromParams = req.params.token;
  const tokenFromBody = req.body.token;
  const token = tokenFromParams || tokenFromBody;
  const { password } = req.body;

  if (!token || typeof token !== "string") {
    return res
      .status(400)
      .json({ message: "Password reset token is required." });
  }

  try {
    // Hash the token from the request to compare with stored hashed token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne<IUser>({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Password reset token is invalid or has expired." });
    }
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Send password change confirmation using template + enhanced sender
    const confirmEmail = createPasswordChangeConfirmationTemplate(user.email, {
      recipientName: user.name,
      supportEmail: process.env.EMAIL_USER || "support@familywebsite.com",
    });
    await sendEmailWithRetry({
      to: user.email,
      subject: confirmEmail.subject,
      html: confirmEmail.html,
      text: confirmEmail.text,
      validateUrls: true,
    });

    return res.status(200).json({ message: "Your password has been updated." });
  } catch (err: unknown) {
    logError(err as Error, "reset_password", {
      tokenProvided: !!token,
    });
    return res.status(500).json({ message: "Error resetting password." });
  }
};

export const logout = async (
  req: Request,
  res: Response<AuthResponse>,
): Promise<Response<AuthResponse>> => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(204).json({ message: "No refresh token found." });
  }
  try {
    const decoded = jwt.verify(refreshToken, refreshTokenSecret) as {
      id: string;
    };
    const userId = String(decoded.id);
    const user = await User.findById<IUser>(userId);

    if (user) {
      user.refreshTokens = user.refreshTokens.filter(
        (token) => token !== refreshToken,
      );
      await user.save();
    }
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (err: unknown) {
    logError(err as Error, "user_logout", {
      hasRefreshToken: !!refreshToken,
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    return res
      .status(200)
      .json({ message: "Logged out successfully (token invalid)." });
  }
};

export const changePassword = async (
  req: Request,
  res: Response<AuthResponse>,
): Promise<Response<AuthResponse>> => {
  try {
    if (!(req.user as IUser)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    const user = await User.findById<IUser>((req.user as IUser as IUser)?.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.password) {
      return res.status(400).json({ message: "User has no password set." });
    }

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    logError(err as Error, "change_password", {
      userId: (req.user as IUser)?.id,
    });
    return res.status(500).json({ message: "Failed to change password." });
  }
};

export const checkUsernameAvailability = async (
  req: Request<{ username: string }>,
  res: Response<{ available: boolean; message?: string }>,
): Promise<Response<{ available: boolean; message?: string }>> => {
  try {
    const { username } = req.params;

    // Validate username format
    if (!username || username.length < 3) {
      return res.status(400).json({
        available: false,
        message: "Username must be at least 3 characters long",
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        available: false,
        message: "Username can only contain letters, numbers, and underscores",
      });
    }

    // Check if username exists
    const existingUser = await User.findOne<IUser>({
      username: username.toLowerCase(),
    });

    return res.json({
      available: !existingUser,
      message: existingUser
        ? "Username is already taken"
        : "Username is available",
    });
  } catch (error) {
    logError(error as Error, "check_username_availability", {
      username: sanitizeLog(req.params.username || "unknown"),
    });
    return res.status(500).json({
      available: false,
      message: "Error checking username availability",
    });
  }
};

export const updateUserProfile = async (
  req: Request,
  res: Response,
): Promise<Response<AuthResponse>> => {
  const { username } = req.params;
  const { name, dateOfBirth, phoneNumber, gender, relationship } = req.body;

  if (!(req.user as IUser)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Ensure the user making the request is the user being updated
  if ((req.user as IUser as IUser)?.username !== username) {
    return res
      .status(403)
      .json({ message: "Forbidden: You can only update your own profile." });
  }

  try {
    const user = await User.findOne<IUser>({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update fields if they are provided in the request body
    if (name) user.name = String(name).trim();

    if (dateOfBirth) {
      // Accept YYYY-MM-DD and convert to Date
      const parsed = new Date(String(dateOfBirth));
      if (isNaN(parsed.getTime())) {
        return res
          .status(400)
          .json({ message: "Invalid dateOfBirth format. Use YYYY-MM-DD." });
      }
      user.dateOfBirth = parsed;
    }

    if (phoneNumber !== undefined) {
      const trimmed = (phoneNumber ?? "").toString().trim();
      user.phoneNumber = trimmed.length === 0 ? undefined : trimmed;
    }

    if (gender) {
      const normalizedGender = String(gender).toLowerCase();
      const allowed = [Gender.MALE, Gender.FEMALE, Gender.PREFER_NOT_TO_SAY];
      if (!allowed.includes(normalizedGender as Gender)) {
        return res.status(400).json({
          message:
            'Invalid gender. Allowed values: "male", "female", "prefer not to say".',
        });
      }
      user.gender = normalizedGender as Gender;
    }

    if (relationship !== undefined) {
      const normalizedRelationship = String(relationship).toLowerCase();
      const allowedRelationships = [
        RelationshipType.SELF,
        RelationshipType.FATHER,
        RelationshipType.MOTHER,
        RelationshipType.SON,
        RelationshipType.DAUGHTER,
        RelationshipType.BROTHER,
        RelationshipType.SISTER,
        RelationshipType.HUSBAND,
        RelationshipType.WIFE,
        RelationshipType.GRANDFATHER,
        RelationshipType.GRANDMOTHER,
        RelationshipType.UNCLE,
        RelationshipType.AUNT,
        RelationshipType.COUSIN,
        RelationshipType.NEPHEW,
        RelationshipType.NIECE,
        RelationshipType.SON_IN_LAW,
        RelationshipType.DAUGHTER_IN_LAW,
        RelationshipType.BROTHER_IN_LAW,
        RelationshipType.SISTER_IN_LAW,
        RelationshipType.OTHER,
      ];
      if (
        normalizedRelationship &&
        !allowedRelationships.includes(
          normalizedRelationship as RelationshipType,
        )
      ) {
        return res.status(400).json({
          message: "Invalid relationship value.",
        });
      }
      user.relationship = normalizedRelationship as RelationshipType;
    }

    await user.save();

    const userProfile: UserProfile = {
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      dateOfBirth: user.dateOfBirth
        ? user.dateOfBirth.toISOString().split("T")[0]
        : undefined,
      phoneNumber: user.phoneNumber,
      gender: user.gender as Gender,
      relationship: user.relationship as RelationshipType | undefined,
      isVerified: user.isVerified,
    };

    return res
      .status(200)
      .json({ message: "Profile updated successfully", userProfile });
  } catch (err) {
    const anyErr = err as unknown as {
      name?: string;
      message?: string;
      errors?: unknown;
    };
    if (anyErr?.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation failed while updating profile.",
        details: anyErr?.message,
      });
    }
    logError(err as Error, "update_user_profile", {
      username: sanitizeLog(req.params.username || "unknown"),
      userId: (req.user as IUser)?.id,
    });
    return res.status(500).json({ message: "Error updating user profile." });
  }
};
