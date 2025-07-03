import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // For generating random tokens
import { sendEmail } from '../utils/emailService'; // Import email service
import User from '../models/User';

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET;

// Fail-safe: Ensure JWT_SECRET is defined.
if (!jwtSecret) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in the environment variables.');
  process.exit(1); // Exit the process with an error code
}


// Register Route
router.post('/register', (async (req: Request, res: Response) => {
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

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

    res.status(201).json({ message: 'User registered successfully. Please check your email for verification.', token });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed. Please try again later.' });
  }
}) as RequestHandler);

// Sign In Route
router.post('/login', (async (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email before logging in.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

    res.json({ message: 'Logged in successfully', token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(400).json({ message: 'Invalid credentials' });
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

export default router;