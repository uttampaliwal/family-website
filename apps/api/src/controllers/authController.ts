import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../utils/emailService';
import User from '../models/User';
import type { AuthResponse, RegisterRequest, LoginRequest, VerifyEmailRequest, ResendVerificationRequest, ForgotPasswordRequest, ResetPasswordRequest, UserProfile } from '../types/auth';

const jwtSecret = process.env.JWT_SECRET as string;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET as string;

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export const register = async (req: Request<any, any, RegisterRequest>, res: Response<AuthResponse>) => {
  const { name, email, password, dob, username, gender, phoneNumber } = req.body;

  try {
    // Sanitize email input to prevent NoSQL injection
    if (typeof email !== 'string') {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    let user = await User.findOne({ email: email });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Sanitize username input to prevent NoSQL injection
    if (typeof username !== 'string') {
      return res.status(400).json({ message: 'Invalid username format' });
    }
    user = await User.findOne({ username: username });
    if (user) {
      return res.status(400).json({ message: 'Username is already taken. Please choose another.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(20).toString('hex');

    user = new User({
      name,
      email,
      password: hashedPassword,
      dob,
      phoneNumber,      username,
      gender,
      verificationToken,
    });

    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    await sendEmail({
      to: email,
      subject: 'Verify Your Email for Family Website',
      html: `<p>Please click the link below to verify your email address:</p><p><a href="${verificationUrl}">Verify Email</a></p><p>This link will expire in 24 hours for security purposes.</p>`,
    });

      if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is not configured');
      }
      const accessToken = jwt.sign(
      {
        id: user.id,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString('hex')
      },
      jwtSecret,
      {
        expiresIn: '15m',
        algorithm: 'HS512',
        issuer: 'family-website',
        audience: 'family-website-users'
      }
    );
    const refreshToken = jwt.sign(
      {
        id: user.id,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString('hex')
      },
      refreshTokenSecret,
      {
        expiresIn: '7d',
        algorithm: 'HS512',
        issuer: 'family-website',
        audience: 'family-website-users'
      }
    );

    user.refreshTokens.push(refreshToken);
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({ message: 'User registered successfully. Please check your email for verification.', accessToken: accessToken, username: String(user.username).replace(/[<>"'&\/<>]/g, '').replace(/javascript:/gi, '').replace(/on\w+=/gi, '') });
  } catch (err) {
    const sanitizedError = {
      message: err instanceof Error ? err.message.replace(/[\n\r\t]/g, '') : 'Unknown error',
      email: String(email).replace(/[\n\r\t]/g, ''),
      username: String(username).replace(/[\n\r\t]/g, ''),
      timestamp: new Date().toISOString(),
      operation: 'register'
    };
    console.error('Registration error:', JSON.stringify(sanitizedError));
    res.status(500).json({ message: 'Registration failed. Please try again later.' });
  }
};

export const login = async (req: Request<any, any, LoginRequest>, res: Response<AuthResponse>) => {
  const { emailOrUsername, password } = req.body;

  try {
    // Prevent NoSQL injection by ensuring identifier is treated as a string literal
    if (typeof emailOrUsername !== 'string') {
      return res.status(400).json({ message: 'Invalid email or username format' });
    }
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });
    if (!user) {
      return res.status(400).json({ message: 'No account found with that email or username. Please register.' });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const timeLeft = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
      const sanitizedTimeLeft = Math.max(0, Math.floor(Number(timeLeft) || 0));
      return res.status(403).json({ message: 'Account is temporarily locked. Please try again later.' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email before logging in.' });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = Date.now() + LOCK_TIME;
        await user.save();
        return res.status(403).json({ message: `Too many failed login attempts. Account locked for ${LOCK_TIME / (1000 * 60 * 60)} hours.` });
      }
      await user.save();
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const accessToken = jwt.sign(
      { 
        id: user.id,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString('hex')
      }, 
      jwtSecret, 
      { 
        expiresIn: '15m',
        algorithm: 'HS512',
        issuer: 'family-website',
        audience: 'family-website-users'
      }
    );
    const refreshToken = jwt.sign(
      { 
        id: user.id,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString('hex')
      }, 
      refreshTokenSecret, 
      { 
        expiresIn: '7d',
        algorithm: 'HS512',
        issuer: 'family-website',
        audience: 'family-website-users'
      }
    );

    user.refreshTokens.push(refreshToken);
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ message: 'Logged in successfully', accessToken: accessToken, username: String(user.username).replace(/[<>"'&\/<>]/g, '').replace(/javascript:/gi, '').replace(/on\w+=/gi, '') });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
};

export const verifyEmail = async (req: Request<any, any, VerifyEmailRequest>, res: Response<AuthResponse>) => {
  const { token } = req.body;

  try {
    // Validate token format before querying database
    if (!token || typeof token !== 'string' || !/^[a-f0-9]{40}$/.test(token)) {
      return res.status(400).json({ message: 'Invalid verification token format.' });
    }
    
    const user = await User.findOne({ verificationToken: token });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully! You can now sign in.' });
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ message: 'Email verification failed. Please try again later.' });
  }
};

export const resendVerification = async (req: Request<any, any, ResendVerificationRequest>, res: Response<AuthResponse>) => {
  const { emailOrUsername } = req.body;

  try {
    // Sanitize input to prevent NoSQL injection
    if (typeof emailOrUsername !== 'string') {
      return res.status(400).json({ message: 'Invalid email or username format' });
    }
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified. Please log in.' });
    }

    const verificationToken = user.verificationToken;

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email for Family Website',
      html: `<p>Please click the link below to verify your email address:</p><p><a href="${verificationUrl}">Verify Email</a></p><p>This link will expire in 24 hours for security purposes.</p>`,
    });

    res.status(200).json({ message: 'Verification email sent successfully. Please check your inbox.' });
  } catch (err) {
    console.error('Resend verification email error:', err);
    res.status(500).json({ message: 'Failed to resend verification email. Please try again later.' });
  }
};

export const refreshToken = async (req: Request, res: Response<AuthResponse>) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided.' });
  }

  try {
    const decoded: any = jwt.verify(refreshToken, refreshTokenSecret);
    const user = await User.findById(String(decoded.id));

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(403).json({ message: 'Invalid refresh token.' });
    }

    const newAccessToken = jwt.sign(
      { 
        id: user.id,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString('hex')
      }, 
      jwtSecret, 
      { 
        expiresIn: '15m',
        algorithm: 'HS512',
        issuer: 'family-website',
        audience: 'family-website-users'
      }
    );

    if (!refreshTokenSecret) {
      throw new Error('REFRESH_TOKEN_SECRET environment variable is not configured');
    }
    const newRefreshToken = jwt.sign(
      { 
        id: user.id,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString('hex')
      }, 
      refreshTokenSecret, 
      { 
        expiresIn: '7d',
        algorithm: 'HS512',
        issuer: 'family-website',
        audience: 'family-website-users'
      }
    );
    user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.status(200).json({ accessToken: newAccessToken, message: 'Token refreshed successfully.' });
    
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(403).json({ message: 'Invalid or expired refresh token.' });
  }
};

export const getUserProfile = async (req: Request<{ username: string }>, res: Response<UserProfile | AuthResponse>) => {
  try {
    // Prevent NoSQL injection by using exact string comparison
    const username = String(req.params.username);
    const user = await User.findOne({ username: username }).select('-password -verificationToken');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Sanitize user data before returning to prevent XSS
    const sanitizedUser = {
      ...user.toObject(),
      name: String(user.name || '').replace(/[<>"'&]/g, ''),
      username: String(user.username || '').replace(/[<>"'&]/g, ''),
      email: String(user.email || '').replace(/[<>"'&]/g, '')
    };
    
    res.status(200).json(sanitizedUser);
  } catch (err: any) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

export const updateUserProfile = async (req: Request<{ username: string }, any, UserProfile>, res: Response<AuthResponse>) => {
  try {
    const { username } = req.params;
    const { name, dob, phoneNumber, gender } = req.body;

    const user = await User.findOne({ username: username });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.name = name || user.name;
    user.dateOfBirth = dob || user.dateOfBirth;
      phoneNumber,
    user.gender = gender || user.gender;

    await user.save();

    res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (err: any) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
};

export const forgotPassword = async (req: Request<any, any, ForgotPasswordRequest>, res: Response<AuthResponse>) => {
  const { email } = req.body;

  try {
    if (typeof email !== 'string') {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: 'User with that email does not exist.' });
    }

    // Generate a secure random token and hash it for storage
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await user.save();

    // Send the unhashed token to the user via email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
             <p>Please visit the password reset page and enter your reset code:</p>
             <p><a href="${resetUrl.replace(/[<>"'&]/g, '')}">Reset Password</a></p>
             <p>Your reset code: <strong>${resetToken.replace(/[<>"'&]/g, '')}</strong></p>
             <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`,
    });

    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Error sending password reset email.' });
  }
};

export const resetPassword = async (req: Request<{ token?: string }, any, ResetPasswordRequest>, res: Response<AuthResponse>) => {
  // Get token from either params or body
  const tokenFromParams = req.params.token;
  const tokenFromBody = req.body.token;
  const token = tokenFromParams || tokenFromBody;
  const { password } = req.body;
  
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ message: 'Password reset token is required.' });
  }
  
  try {
    // Hash the token from the request to compare with stored hashed token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Your password has been changed',
      html: `<p>Hello,</p>
             <p>This is a confirmation that the password for your account has just been changed.</p>`,
    });

    res.status(200).json({ message: 'Your password has been updated.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Error resetting password.' });
  }
};

export const logout = async (req: Request, res: Response<AuthResponse>) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(204).json({ message: 'No refresh token found.' });
  }

  try {
    const decoded: any = jwt.verify(refreshToken, refreshTokenSecret);
    const user = await User.findById(String(decoded.id));

    if (user) {
      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
      await user.save();
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.status(200).json({ message: 'Logged out successfully (token invalid).', error: { message: err instanceof Error ? err.message : 'Unknown error' } });
  }
};
