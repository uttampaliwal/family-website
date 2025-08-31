import mongoose, { Document } from "mongoose";

// Define the User interface
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  name: string;
  email: string;
  password?: string;
  dateOfBirth: Date;
  phoneNumber?: string;
  username: string;
  gender: "male" | "female" | "prefer not to say";
  relationship?: string;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  isVerified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  refreshTokens: string[];
  loginAttempts: number;
  lockUntil?: number;
  githubId?: string;
  googleId?: string;
  authProvider: "local" | "github" | "google";
  avatar?: string;
  friends: mongoose.Types.ObjectId[];
  friendRequests: {
    sent: mongoose.Types.ObjectId[];
    received: mongoose.Types.ObjectId[];
  };
  groups: mongoose.Types.ObjectId[];
  isOnline: boolean;
  lastSeen: Date;
  role: "user" | "admin";
  adminApprovalStatus: "pending" | "approved" | "rejected";
  auditLog: { event: string; timestamp: Date; details?: string }[];
}

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
    required: function (this: IUser) {
      return this.authProvider === "local";
    },
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
  relationship: {
    type: String,
    required: false,
    enum: {
      values: [
        "self",
        "father",
        "mother",
        "son",
        "daughter",
        "brother",
        "sister",
        "husband",
        "wife",
        "grandfather",
        "grandmother",
        "uncle",
        "aunt",
        "cousin",
        "nephew",
        "niece",
        "son-in-law",
        "daughter-in-law",
        "brother-in-law",
        "sister-in-law",
        "other",
      ],
      message: "Invalid relationship type",
    },
  },
  verificationToken: {
    type: String,
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
  // OAuth fields
  githubId: {
    type: String,
    sparse: true,
    unique: true,
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true,
  },
  authProvider: {
    type: String,
    enum: ["local", "github", "google"],
    default: "local",
  },
  avatar: {
    type: String,
  },
  // Social features
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  friendRequests: {
    sent: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    received: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  groups: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
  ],
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  adminApprovalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  auditLog: [
    {
      event: String,
      timestamp: { type: Date, default: Date.now },
      details: String,
    },
  ],
});

// Indexes for faster lookups
UserSchema.index({ resetPasswordToken: 1 });
UserSchema.index({ lockUntil: 1 }, { sparse: true });

export default mongoose.model<IUser>("User", UserSchema);
