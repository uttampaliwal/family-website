import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  mobileNumber: {
    type: String,
    required: false,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Prefer not to say'],
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('User', UserSchema);