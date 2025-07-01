import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // For generating random tokens
import User from '../models/User';

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey'; // Use a strong secret in production

// Sign Up Route
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(20).toString('hex');

    user = new User({
      name,
      email,
      password: hashedPassword,
      verificationToken,
    });

    await user.save();

    // TODO: Send verification email
    const verificationUrl = `http://localhost:5173/verify-email?token=${verificationToken}`;
    console.log(`Verification URL: ${verificationUrl}`); // For development

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

    res.status(201).json({ message: 'User registered successfully. Please check your email for verification.', token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Sign In Route
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email before signing in.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

    res.json({ message: 'Signed in successfully', token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Verify Email Route
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    user.isVerified = true;
    user.verificationToken = undefined; // Clear the token after verification
    await user.save();

    res.status(200).json({ message: 'Email verified successfully! You can now sign in.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

export default router;