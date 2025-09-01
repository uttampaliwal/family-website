import mongoose, { Document } from "mongoose";

export interface IAdminAction extends Document {
  _id: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  action: string;
  targetType: "user" | "policy" | "system" | "promotion";
  targetId?: mongoose.Types.ObjectId;
  details: {
    description: string;
    previousState?: Record<string, unknown>;
    newState?: Record<string, unknown>;
    reason?: string;
    confirmationRequired?: boolean;
    confirmedBy?: mongoose.Types.ObjectId[];
    ip?: string;
    userAgent?: string;
  };
  timestamp: Date;
  severity: "low" | "medium" | "high" | "critical";
  status: "pending" | "completed" | "failed" | "reverted";
  metadata?: {
    [key: string]: unknown;
  };
}

const AdminActionSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      "user_approve",
      "user_reject",
      "user_revoke_access",
      "user_restore_access",
      "admin_promotion_request",
      "admin_promotion_approve",
      "admin_promotion_reject",
      "admin_promotion_activate",
      "policy_update",
      "policy_create",
      "session_terminate",
      "bulk_action",
      "system_config_change",
    ],
  },
  targetType: {
    type: String,
    enum: ["user", "policy", "system", "promotion"],
    required: true,
  },
  targetRefPath: {
    type: String,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "targetRefPath",
  },
  details: {
    description: {
      type: String,
      required: true,
    },
    previousState: mongoose.Schema.Types.Mixed,
    newState: mongoose.Schema.Types.Mixed,
    reason: String,
    confirmationRequired: {
      type: Boolean,
      default: false,
    },
    confirmedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    ip: String,
    userAgent: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  severity: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium",
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "reverted"],
    default: "completed",
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

// Pre-save middleware to set targetRefPath
AdminActionSchema.pre("save", function (next) {
  if (this.targetType === "user" || this.targetType === "promotion") {
    this.targetRefPath = "User";
  } else if (this.targetType === "policy") {
    this.targetRefPath = "PolicyVersion";
  }
  next();
});

// Indexes for efficient querying
AdminActionSchema.index({ adminId: 1, timestamp: -1 });
AdminActionSchema.index({ action: 1, timestamp: -1 });
AdminActionSchema.index({ targetType: 1, targetId: 1, timestamp: -1 });
AdminActionSchema.index({ severity: 1, timestamp: -1 });
AdminActionSchema.index({ status: 1, timestamp: -1 });

export default mongoose.model<IAdminAction>("AdminAction", AdminActionSchema);
