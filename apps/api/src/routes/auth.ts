import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // For generating random tokens
import { sendEmail } from '../utils/emailService.js'; // Import email service
import User from '../models/User.js'; // Re-enable User model

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

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

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

// Fail-safe: Ensure JWT_SECRET and REFRESH_TOKEN_SECRET are defined.
if (!jwtSecret || !refreshTokenSecret) {
  console.error('FATAL ERROR: JWT_SECRET or REFRESH_TOKEN_SECRET is not defined in the environment variables.');
  process.exit(1); // Exit the process with an error code
}


// Register Route
router.post('/register', authLimiter, (async (req: Request, res: Response) => {
  const { name, email, password, dob, username, gender, mobileNumber } = req.body;

  // Basic validation
  if (!name || !email || !password || !dob || !username || !gender) {
    return res.status(400).json({ message: 'Please enter all required fields' });
  }

  // Email format validation
  const emailRegex = /^[\S@]+@[\S@]+\.[\S@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }

  // Password strength validation
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }
  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ message: 'Password must contain at least one uppercase letter' });
  }
  if (!/[a-z]/.test(password)) {
    return res.status(400).json({ message: 'Password must contain at least one lowercase letter' });
  }
  if (!/[0-9]/.test(password)) {
    return res.status(400).json({ message: 'Password must contain at least one number' });
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return res.status(400).json({ message: 'Password must contain at least one special character' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    user = await User.findOne({ username });
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
      mobileNumber,
      username,
      gender,
      verificationToken,
    });

    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    // Send verification email
    await sendEmail({
      to: email,
      subject: 'Verify Your Email for Family Website',
      html: `<p>Please click the following link to verify your email:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`,
    });

    const accessToken = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, refreshTokenSecret, { expiresIn: '7d' });

    user.refreshTokens.push(refreshToken);
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({ message: 'User registered successfully. Please check your email for verification.', token: accessToken, username: user.username });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed. Please try again later.' });
  }
}) as RequestHandler);

// Sign In Route
router.post('/login', loginLimiter, (async (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const timeLeft = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
      return res.status(403).json({ message: `Account locked. Please try again in ${timeLeft} minutes.` });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email before logging in.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
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

    // Successful login: reset login attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const accessToken = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, refreshTokenSecret, { expiresIn: '7d' });

    user.refreshTokens.push(refreshToken);
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ message: 'Logged in successfully', token: accessToken, username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
}) as RequestHandler);

// Verify Email Route
router.post('/verify-email', (async (req: Request, res: Response) => {
  const { token } = req.body; // Token should be sent in the request body for security

  try {
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    user.isVerified = true;
    user.verificationToken = undefined; // Clear the token after verification

    res.status(200).json({ message: 'Email verified successfully! You can now sign in.' });
    await user.save(); // Save after sending response
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ message: 'Email verification failed. Please try again later.' });
  }
}) as RequestHandler);

// Resend Verification Email Route
router.post('/resend-verification', (async (req: Request, res: Response) => {
  const { identifier } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified. Please log in.' });
    }

    // Reuse existing verification token
    const verificationToken = user.verificationToken;

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    // Send verification email
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email for Family Website',
      html: `<p>Please click the following link to verify your email:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`,
    });

    res.status(200).json({ message: 'Verification email sent successfully. Please check your inbox.' });
  } catch (err) {
    console.error('Resend verification email error:', err);
    res.status(500).json({ message: 'Failed to resend verification email. Please try again later.' });
  }
}) as RequestHandler);

// Get User Profile by Username
// Refresh Token Route
router.post('/refresh-token', (async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided.' });
  }

  try {
    const decoded: any = jwt.verify(refreshToken, refreshTokenSecret);
    const user = await User.findById(decoded.id);

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(403).json({ message: 'Invalid refresh token.' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '15m' });

    res.json({ accessToken: newAccessToken, username: user.username });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(403).json({ message: 'Invalid or expired refresh token.' });
  }
}) as RequestHandler);

router.get('/profile/:username', (async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-password -verificationToken'); // Exclude sensitive fields

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
}) as RequestHandler);

router.post('/forgot-password', (async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with that email does not exist.' });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
             <p>Please click on the following link, or paste this into your browser to complete the process:</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>
             <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`,
    });

    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Error sending password reset email.' });
  }
}) as RequestHandler);

router.post('/reset-password/:token', (async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    // Invalidate the token immediately to prevent replay attacks
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save(); // Save the user with invalidated token

    // Now proceed with password update
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save(); // Save again with new password

    await sendEmail({
      to: user.email,
      subject: 'Your password has been changed',
      html: `<p>Hello,</p>
             <p>This is a confirmation that the password for your account ${user.email} has just been changed.</p>`,
    });

    res.status(200).json({ message: 'Your password has been updated.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Error resetting password.' });
  }
}) as RequestHandler);

router.post('/logout', (async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(204).json({ message: 'No refresh token found.' }); // No content to send
  }

  try {
    const decoded: any = jwt.verify(refreshToken, refreshTokenSecret);
    const user = await User.findById(decoded.id);

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
    res.status(200).json({ message: 'Logged out successfully (token invalid).', error: err });
  }
}) as RequestHandler);

export default router;