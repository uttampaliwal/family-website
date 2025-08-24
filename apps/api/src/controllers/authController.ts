import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../utils/emailService.js";
import User from "../models/User.js";
import {
  RegisterRequest,
  LoginRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  UserProfile,
  Gender,
} from "../types/auth";
import { sanitizeLog } from "../utils/logSanitizer.js";

const jwtSecret = process.env.JWT_SECRET as string;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET as string;

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

import { htmlEncode } from "../utils/sanitization.js";

export const register = async (
  req: Request<Record<string, never>, Record<string, never>, RegisterRequest>,
  res: Response<AuthResponse>,
): Promise<Response<AuthResponse>> => {
  const { name, email, password, dateOfBirth, username, phoneNumber } =
    req.body;
  const gender = req.body.gender as Gender;

  try {
    // Sanitize email input to prevent NoSQL injection
    if (typeof email !== "string") {
      return res.status(400).json({ message: "Invalid email format" });
    }
    const sanitizedEmail = sanitizeForQuery(email);
    let user = await User.findOne({ email: sanitizedEmail });
    if (user) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Sanitize username input to prevent NoSQL injection
    if (typeof username !== "string") {
      return res.status(400).json({ message: "Invalid username format" });
    }
    const sanitizedUsername = sanitizeForQuery(username);
    user = await User.findOne({ username: sanitizedUsername });
    if (user) {
      return res
        .status(400)
        .json({ message: "Username is already taken. Please choose another." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(20).toString("hex");

    user = new User({
      name,
      email,
      password: hashedPassword,
      dateOfBirth,
      phoneNumber,
      username,
      gender,
      verificationToken,
    });

    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: email,
      subject: "Verify Your Email for Family Website",
      html: `<p>Please click the link below to verify your email address:</p><p><a href="${htmlEncode(verificationUrl)}">Verify Email</a></p><p>This link will expire in 24 hours for security purposes.</p>`,
    });

    if (!jwtSecret) {
      return res
        .status(500)
        .json({ message: "Server error: JWT_SECRET not configured." });
    }
    if (!refreshTokenSecret) {
      return res.status(500).json({
        message: "Server error: REFRESH_TOKEN_SECRET not configured.",
      });
    }
    const accessToken = jwt.sign(
      {
        id: user.id,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString("hex"),
      },
      Buffer.from(jwtSecret, "hex"),
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
      Buffer.from(refreshTokenSecret, "hex"),
      {
        expiresIn: "7d",
        algorithm: "HS512",
        issuer: "family-website",
        audience: "family-website-users",
      },
    );

    user.refreshTokens.push(refreshToken);
    await user.save();

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
  } catch {
    // Registration error - handle with structured logging
    return res
      .status(500)
      .json({ message: "Registration failed. Please try again later." });
  }
};

const sanitizeForQuery = (input: string) => {
  return input.replace(/[^a-zA-Z0-9@.]/g, "");
};

export const login = async (
  req: Request<Record<string, never>, Record<string, never>, LoginRequest>,
  res: Response<AuthResponse>,
): Promise<Response<AuthResponse>> => {
  const { emailOrUsername, password } = req.body;

  try {
    // Prevent NoSQL injection by ensuring identifier is treated as a string literal
    if (typeof emailOrUsername !== "string") {
      return res
        .status(400)
        .json({ message: "Invalid email or username format" });
    }
    const sanitizedIdentifier = sanitizeForQuery(emailOrUsername);
    const user = await User.findOne({
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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = Date.now() + LOCK_TIME;
        await user.save();
        return res.status(403).json({
          message: `Too many failed login attempts. Account locked for ${LOCK_TIME / (1000 * 60 * 60)} hours.`,
        });
      }
      await user.save();
      return res.status(400).json({ message: "Invalid credentials" });
    }
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    if (!jwtSecret) {
      return res
        .status(500)
        .json({ message: "Server error: JWT_SECRET not configured." });
    }
    const accessToken = jwt.sign(
      {
        id: user.id,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString("hex"),
      },
      Buffer.from(jwtSecret, "hex"),
      {
        expiresIn: "15m",
        algorithm: "HS512",
        issuer: "family-website",
        audience: "family-website-users",
      },
    );
    if (!refreshTokenSecret) {
      return res.status(500).json({
        message: "Server error: REFRESH_TOKEN_SECRET not configured.",
      });
    }
    const refreshToken = jwt.sign(
      {
        id: user.id,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString("hex"),
      },
      Buffer.from(refreshTokenSecret, "hex"),
      {
        expiresIn: "7d",
        algorithm: "HS512",
        issuer: "family-website",
        audience: "family-website-users",
      },
    );

    user.refreshTokens.push(refreshToken);
    await user.save();

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
    });
  } catch (err) {
    console.error(
      "Login error:",
      sanitizeLog((err as Error).message || String(err)),
    );
    return res.status(500).json({ message: "An error occurred during login." });
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
    if (!token || typeof token !== "string" || !/^[a-f0-9]{40}$/.test(token)) {
      return res
        .status(400)
        .json({ message: "Invalid verification token format." });
    }

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token." });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return res
      .status(200)
      .json({ message: "Email verified successfully! You can now sign in." });
  } catch {
    // Email verification error - handle with structured logging
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
  const { emailOrUsername } = req.body;

  try {
    // Sanitize input to prevent NoSQL injection
    if (typeof emailOrUsername !== "string" || !emailOrUsername.trim()) {
      return res
        .status(400)
        .json({ message: "Invalid email or username format" });
    }

    // Sanitize the input to prevent NoSQL injection
    const sanitizedInput = String(emailOrUsername).trim();

    const user = await User.findOne({
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

    const verificationToken = user.verificationToken;

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: user.email,
      subject: "Verify Your Email for Family Website",
      html: `<p>Please click the link below to verify your email address:</p><p><a href="${htmlEncode(verificationUrl)}">Verify Email</a></p><p>This link will expire in 24 hours for security purposes.</p>`,
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
    if (!refreshTokenSecret) {
      throw new Error(
        "REFRESH_TOKEN_SECRET environment variable is not configured",
      );
    }
    const decoded = jwt.verify(
      refreshToken,
      Buffer.from(refreshTokenSecret, "hex"),
    ) as { id: string };
    const user = await User.findById(String(decoded.id));

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(403).json({ message: "Invalid refresh token." });
    }
    if (!jwtSecret) {
      return res
        .status(500)
        .json({ message: "Server error: JWT_SECRET not configured." });
    }
    const newAccessToken = jwt.sign(
      {
        id: user.id,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString("hex"),
      },
      Buffer.from(jwtSecret, "hex"),
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
      Buffer.from(refreshTokenSecret, "hex"),
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
    const user = await User.findOne({ username: username }).select(
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
      isVerified: user.isVerified,
    };

    return res.status(200).json(sanitizedUser);
  } catch {
    // Error fetching user profile - handle with structured logging
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
    const user = await User.findOne({ email: sanitizedEmail });

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

      // Send the unhashed token to the user via email
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password`;

      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        html: `<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
             <p>Please visit the password reset page and enter your reset code:</p>
             <p><a href="${htmlEncode(resetUrl)}">Reset Password</a></p>
             <p>Your reset code: <strong>${htmlEncode(resetToken)}</strong></p>
             <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`,
      });
    }

    // Always return a generic success message to prevent user enumeration
    return res
      .status(200)
      .json({ message: "Password reset link sent to your email." });
  } catch (err: unknown) {
    console.error("Forgot password error:", err);
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

    const user = await User.findOne({
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

    await sendEmail({
      to: user.email,
      subject: "Your password has been changed",
      html: `<p>Hello,</p>
             <p>This is a confirmation that the password for your account ${htmlEncode(user.email)} has just been changed.</p>`,
    });

    return res.status(200).json({ message: "Your password has been updated." });
  } catch (err: unknown) {
    console.error("Reset password error:", err);
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
    const decoded = jwt.verify(
      refreshToken,
      Buffer.from(refreshTokenSecret, "hex"),
    ) as { id: string };
    const userId = String(decoded.id);
    const user = await User.findById(userId);

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
    console.error(
      "Logout error:",
      sanitizeLog((err as Error).message || String(err)),
    );
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

export const updateUserProfile = async (
  req: Request,
  res: Response,
): Promise<Response<AuthResponse>> => {
  const { username } = req.params;
  const { name, dateOfBirth, phoneNumber, gender } = req.body;

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Ensure the user making the request is the user being updated
  if (req.user.username !== username) {
    return res
      .status(403)
      .json({ message: "Forbidden: You can only update your own profile." });
  }

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update fields if they are provided in the request body
    if (name) user.name = name;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (gender) user.gender = gender as Gender;

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
      isVerified: user.isVerified,
    };

    return res
      .status(200)
      .json({ message: "Profile updated successfully", userProfile });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ message: "Error updating user profile." });
  }
};
