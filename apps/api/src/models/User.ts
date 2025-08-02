import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  phoneNumber: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^[+]?[1-9]\d{1,14}$/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other'],
    message: 'Gender must be male, female, or other'
  },
  verificationToken: {
    type: String,
    unique: true,
    sparse: true, // Allows null values to not violate unique constraint
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  refreshTokens: [String], // Array to store multiple refresh tokens
  loginAttempts: { type: Number, required: true, default: 0 },
  lockUntil: { type: Number },
});

// Index for faster lookups
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

export default mongoose.model('User', UserSchema);
