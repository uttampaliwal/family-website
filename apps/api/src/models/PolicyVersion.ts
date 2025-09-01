import mongoose, { Document } from "mongoose";

export interface IPolicyVersion extends Document {
  _id: mongoose.Types.ObjectId;
  policyType: "terms" | "privacy" | "other";
  title: string;
  content: string;
  version: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  isActive: boolean;
  previousVersion?: mongoose.Types.ObjectId;
  changeLog: string;
  effectiveDate: Date;
}

const PolicyVersionSchema = new mongoose.Schema({
  policyType: {
    type: String,
    enum: ["terms", "privacy", "other"],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  version: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  previousVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PolicyVersion",
  },
  changeLog: {
    type: String,
    required: true,
  },
  effectiveDate: {
    type: Date,
    required: true,
  },
});

// Ensure only one active policy per type
PolicyVersionSchema.index(
  { policyType: 1, isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  },
);

export default mongoose.model<IPolicyVersion>(
  "PolicyVersion",
  PolicyVersionSchema,
);
