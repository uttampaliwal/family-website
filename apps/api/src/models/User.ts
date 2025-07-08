import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  dob: {
    type: String,
    required: true,
  },
  mobileNumber: {
    type: String,
  },
  username: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
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
});

// Index for faster lookups
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

export default mongoose.model('User', UserSchema);
