import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      "Please provide a valid email address",
    ],
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters long"],
    maxlength: [128, "Password cannot exceed 128 characters"],
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  phoneNumber: {
    type: String,
    validate: {
      validator: function (phoneNumber: string) {
        if (!phoneNumber || phoneNumber.trim() === "") {
          return true; // Allow empty/null values
        }
        return /^[+]?[1-9]\d{1,14}$/.test(phoneNumber.trim());
      },
      message: "Please provide a valid phone number",
    },
  },
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
    minlength: [3, "Username must be at least 3 characters long"],
    maxlength: [30, "Username cannot exceed 30 characters"],
    match: [
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ],
  },
  gender: {
    type: String,
    required: true,
    enum: {
      values: ["male", "female", "prefer not to say"],
      message: "Gender must be male, female, or prefer not to say",
    },
  },
  verificationToken: {
    type: String,
    unique: true,
    sparse: true, // Allows null values to not violate unique constraint
  },
  verificationTokenExpires: {
    type: Date,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  refreshTokens: {
    type: [String],
    default: [],
    validate: {
      validator: function (tokens: string[]) {
        return tokens.length <= 5; // Limit to 5 tokens max
      },
      message: "Too many refresh tokens stored",
    },
  }, // Array to store multiple refresh tokens
  loginAttempts: { type: Number, required: true, default: 0 },
  lockUntil: { type: Number },
});

// Indexes for faster lookups
UserSchema.index({ verificationToken: 1 }, { sparse: true });
UserSchema.index({ resetPasswordToken: 1 });
UserSchema.index({ lockUntil: 1 }, { sparse: true });

export default mongoose.model("User", UserSchema);
