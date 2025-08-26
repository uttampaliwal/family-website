import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../utils/emailService.js";
import {
  sendEnhancedEmail,
  sendEmailWithRetry,
} from "../utils/enhancedEmailService.js";
import {
  createEmailVerificationTemplate,
  createPasswordResetTemplate,
  createPasswordChangeConfirmationTemplate,
} from "../utils/emailContent.js";
import { createSafeEmailUrl } from "../utils/urlValidator.js";
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
  const { name, email, password, dob, username, mobileNumber } = req.body;
  const gender = req.body.gender as Gender;

  // Input validation
  if (!name || !email || !password || !dob || !username || !gender) {
    return res.status(400).json({
      message: "All required fields must be provided",
    });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long",
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: "Please provide a valid email address",
    });
  }

  // Validate username format
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({
      message:
        "Username must be 3-30 characters and contain only letters, numbers, and underscores",
    });
  }

  // Validate gender
  const validGenders = ["male", "female", "prefer not to say"];
  if (!validGenders.includes(gender.toLowerCase())) {
    return res.status(400).json({
      message: "Gender must be male, female, or prefer not to say",
    });
  }

  try {
    // Sanitize email input to prevent NoSQL injection
    const sanitizedEmail = sanitizeForQuery(email);
    let user = await User.findOne({ email: sanitizedEmail });
    if (user) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Check username availability
    const sanitizedUsername = sanitizeForQuery(username);
    user = await User.findOne({ username: sanitizedUsername });
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
      verificationToken,
      verificationTokenExpires,
    });

    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: email,
      subject: "Verify Your Email for Family Website",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0;">Family Website</h1>
                </div>
                
                <h2 style="color: #212529; margin-bottom: 20px;">Welcome! Please verify your email</h2>
                
                <p style="color: #495057; line-height: 1.6; margin-bottom: 20px;">
                    Hello <strong>${htmlEncode(name)}</strong>,
                </p>
                
                <p style="color: #495057; line-height: 1.6; margin-bottom: 20px;">
                    Thank you for joining Family Website! To complete your account setup and ensure the security of your account, please verify your email address by clicking the button below:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                
                <p style="color: #6c757d; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                    If the button doesn't work, you can copy and paste this link into your browser:
                </p>
                
                <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 14px; margin-bottom: 20px;">
                    ${verificationUrl}
                </p>
                
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                        <strong>Security Notice:</strong> This verification link will expire in 24 hours for your security. 
                        If you didn't create an account with us, please ignore this email.
                    </p>
                </div>
                
                <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px; text-align: center;">
                    <p style="color: #6c757d; font-size: 14px; margin: 0;">
                        If you have any questions, please contact us at 
                        <a href="mailto:${process.env.EMAIL_USER || "support@familywebsite.com"}" style="color: #2563eb;">
                            ${process.env.EMAIL_USER || "support@familywebsite.com"}
                        </a>
                    </p>
                </div>
            </div>
        </body>
        </html>
      `,
    });

    // Generate JWT tokens
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
  } catch (error) {
    // Registration error - handle with structured logging
    console.error("Registration error:", sanitizeLog(String(error)));
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

    // JWT secret is validated at startup
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
    // Refresh token secret is validated at startup
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
    const user = await User.findOne({
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
    console.error("Email verification error:", sanitizeLog(String(error)));
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

    // Generate a new verification token with expiration for resend
    const verificationToken = crypto
      .randomBytes(20)
      .toString("hex")
      .toLowerCase();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    // Use basic email service for now (fallback while debugging enhanced service)
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: user.email,
      subject: "Verify Your Email for Family Website",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0;">Family Website</h1>
                </div>
                
                <h2 style="color: #212529; margin-bottom: 20px;">Email Verification Required</h2>
                
                <p style="color: #495057; line-height: 1.6; margin-bottom: 20px;">
                    Hello <strong>${htmlEncode(user.name)}</strong>,
                </p>
                
                <p style="color: #495057; line-height: 1.6; margin-bottom: 20px;">
                    You requested a new verification email for your Family Website account. Please verify your email address by clicking the button below:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                
                <p style="color: #6c757d; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                    If the button doesn't work, you can copy and paste this link into your browser:
                </p>
                
                <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 14px; margin-bottom: 20px;">
                    ${verificationUrl}
                </p>
                
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                        <strong>Security Notice:</strong> This verification link will expire in 24 hours for your security. 
                        If you didn't request this verification email, please ignore this message.
                    </p>
                </div>
                
                <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px; text-align: center;">
                    <p style="color: #6c757d; font-size: 14px; margin: 0;">
                        If you have any questions, please contact us at 
                        <a href="mailto:${process.env.EMAIL_USER || "support@familywebsite.com"}" style="color: #2563eb;">
                            ${process.env.EMAIL_USER || "support@familywebsite.com"}
                        </a>
                    </p>
                </div>
            </div>
        </body>
        </html>
      `,
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
    const decoded = jwt.verify(
      refreshToken,
      Buffer.from(refreshTokenSecret, "hex"),
    ) as { id: string };
    const user = await User.findById(String(decoded.id));

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

      // Use basic email service for now (fallback while debugging enhanced service)
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password`;

      await sendEmail({
        to: user.email,
        subject: "Password Reset Request - Family Website",
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Password Reset Request</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
              <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                  <div style="text-align: center; margin-bottom: 30px;">
                      <h1 style="color: #2563eb; margin: 0;">Family Website</h1>
                  </div>
                  
                  <h2 style="color: #212529; margin-bottom: 20px;">Password Reset Request</h2>
                  
                  <p style="color: #495057; line-height: 1.6; margin-bottom: 20px;">
                      Hello <strong>${htmlEncode(user.name)}</strong>,
                  </p>
                  
                  <p style="color: #495057; line-height: 1.6; margin-bottom: 20px;">
                      We received a request to reset the password for your Family Website account. To reset your password, please follow these steps:
                  </p>
                  
                  <ol style="color: #495057; line-height: 1.6; margin-bottom: 20px;">
                      <li>Click the "Reset Password" button below</li>
                      <li>Enter your reset code when prompted</li>
                      <li>Create a new secure password</li>
                  </ol>
                  
                  <div style="text-align: center; margin: 30px 0;">
                      <a href="${resetUrl}" style="background-color: #dc3545; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                          Reset Password
                      </a>
                  </div>
                  
                  <p style="color: #495057; line-height: 1.6; margin-bottom: 10px;">
                      <strong>Your reset code:</strong>
                  </p>
                  
                  <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 15px; font-family: monospace; font-size: 18px; font-weight: bold; text-align: center; margin: 15px 0; letter-spacing: 3px; color: #dc3545;">
                      ${htmlEncode(resetToken)}
                  </div>
                  
                  <p style="color: #6c757d; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                      If the button doesn't work, you can copy and paste this link into your browser:
                  </p>
                  
                  <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 14px; margin-bottom: 20px;">
                      ${resetUrl}
                  </p>
                  
                  <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px; margin: 20px 0;">
                      <p style="margin: 0; color: #721c24; font-size: 14px;">
                          <strong>Security Information:</strong><br>
                          • This reset code expires in 1 hour for your security<br>
                          • If you didn't request this reset, please ignore this email<br>
                          • Your password will remain unchanged unless you complete the reset process
                      </p>
                  </div>
                  
                  <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px; text-align: center;">
                      <p style="color: #6c757d; font-size: 14px; margin: 0;">
                          If you have any questions, please contact us at 
                          <a href="mailto:${process.env.EMAIL_USER || "support@familywebsite.com"}" style="color: #2563eb;">
                              ${process.env.EMAIL_USER || "support@familywebsite.com"}
                          </a>
                      </p>
                  </div>
              </div>
          </body>
          </html>
        `,
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

    // Use basic email service for password change confirmation
    await sendEmail({
      to: user.email,
      subject: "Password Changed Successfully - Family Website",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Changed</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0;">Family Website</h1>
                </div>
                
                <h2 style="color: #28a745; margin-bottom: 20px;">✅ Password Changed Successfully</h2>
                
                <p style="color: #495057; line-height: 1.6; margin-bottom: 20px;">
                    Hello <strong>${htmlEncode(user.name)}</strong>,
                </p>
                
                <p style="color: #495057; line-height: 1.6; margin-bottom: 20px;">
                    This email confirms that the password for your Family Website account (${htmlEncode(user.email)}) was successfully changed on ${new Date().toLocaleString()}.
                </p>
                
                <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 4px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #0c5460; font-size: 14px;">
                        <strong>✅ Your account is now secure with your new password.</strong>
                    </p>
                </div>
                
                <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #721c24; font-size: 14px;">
                        <strong>⚠️ Security Alert:</strong> If you didn't make this change, please contact our support team immediately at 
                        <a href="mailto:${process.env.EMAIL_USER || "support@familywebsite.com"}" style="color: #721c24;">
                            ${process.env.EMAIL_USER || "support@familywebsite.com"}
                        </a>
                    </p>
                </div>
                
                <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0; color: #155724; font-size: 14px; font-weight: bold;">
                        Security Tips:
                    </p>
                    <ul style="margin: 0; padding-left: 20px; color: #155724; font-size: 14px;">
                        <li>Keep your password secure and don't share it with anyone</li>
                        <li>Use a unique password that you don't use for other accounts</li>
                        <li>Consider enabling two-factor authentication for added security</li>
                        <li>Log out of shared or public computers after use</li>
                    </ul>
                </div>
                
                <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px; text-align: center;">
                    <p style="color: #6c757d; font-size: 14px; margin: 0;">
                        If you have any questions, please contact us at 
                        <a href="mailto:${process.env.EMAIL_USER || "support@familywebsite.com"}" style="color: #2563eb;">
                            ${process.env.EMAIL_USER || "support@familywebsite.com"}
                        </a>
                    </p>
                </div>
            </div>
        </body>
        </html>
      `,
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
