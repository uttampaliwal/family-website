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
    validate: {
      validator: function(v: string | undefined) {
        if (v === undefined || v === null || v === '') return true; // Not required, so valid if empty
        return /^\+?[1-9]\d{1,14}$/.test(v); // E.164 format (or similar, adjust regex as needed)
      },
      message: (props: { value: string }) => `${props.value} is not a valid mobile number!`
    }
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