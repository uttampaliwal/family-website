import mongoose from 'mongoose';

// Define the schema for user data
const UserDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  events: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    date: {
      type: Date,
      required: true
    },
    location: {
      type: String
    },
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  photos: [{
    title: {
      type: String
    },
    description: {
      type: String
    },
    url: {
      type: String,
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    tags: [String]
  }],
  tasks: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    dueDate: {
      type: Date
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
    assignedTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  emergencyContacts: [{
    name: {
      type: String,
      required: true
    },
    relationship: {
      type: String
    },
    phoneNumber: {
      type: String,
      required: true
    },
    email: {
      type: String
    },
    address: {
      type: String
    }
  }]
}, {
  timestamps: true
});

// Create indexes for faster queries
UserDataSchema.index({ 'events.date': 1 });
UserDataSchema.index({ 'tasks.dueDate': 1 });
UserDataSchema.index({ 'tasks.status': 1 });

export default mongoose.model('UserData', UserDataSchema);