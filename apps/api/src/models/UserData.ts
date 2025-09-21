import mongoose, { Document } from "mongoose";

// Define interfaces for better type safety
export interface IEvent {
  title: string;
  description?: string;
  date: Date;
  location?: string;
  participants: mongoose.Types.ObjectId[];
  createdAt: Date;
}

export interface IPhoto {
  title?: string;
  description?: string;
  caption?: string;
  url?: string;
  uploadDate?: Date;
  tags?: string[];
}

export interface ITask {
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed";
  assignedTo?: mongoose.Types.ObjectId[];
  createdAt: Date;
}

export interface IEmergencyContact {
  name: string;
  relationship?: string | null;
  phoneNumber: string;
  email?: string | null;
  address?: string | null;
}

export interface IUserData extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  events: IEvent[];
  photos: IPhoto[];
  tasks: ITask[];
  emergencyContacts: IEmergencyContact[];
  createdAt: Date;
  updatedAt: Date;
}

// Constants for better maintainability
const PRIORITY_LEVELS = ["low", "medium", "high"] as const;
const TASK_STATUSES = ["pending", "in-progress", "completed"] as const;

// Sub-schemas for better organization
const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  location: { type: String },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

const PhotoSchema = new mongoose.Schema({
  title: { type: String },
  description: { type: String },
  caption: { type: String },
  url: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  tags: [String],
});

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  priority: { type: String, enum: PRIORITY_LEVELS, default: "medium" },
  status: { type: String, enum: TASK_STATUSES, default: "pending" },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

const EmergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relationship: { type: String },
  phoneNumber: { type: String, required: true },
  email: { type: String },
  address: { type: String },
});

// Main schema definition
const UserDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    events: [EventSchema],
    photos: [PhotoSchema],
    tasks: [TaskSchema],
    emergencyContacts: [EmergencyContactSchema],
  },
  {
    timestamps: true,
  },
);

// Create indexes for faster queries
UserDataSchema.index({ "events.date": 1 });
UserDataSchema.index({ "tasks.dueDate": 1 });
UserDataSchema.index({ "tasks.status": 1 });
// Compound indexes for common query patterns
UserDataSchema.index({ userId: 1, "events.date": 1 });
UserDataSchema.index({ userId: 1, "tasks.status": 1, "tasks.dueDate": 1 });
UserDataSchema.index({ userId: 1, "photos.uploadDate": -1 });

export default mongoose.model<IUserData>("UserData", UserDataSchema);
