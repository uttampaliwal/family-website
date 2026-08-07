import mongoose, { type Document, type Model } from "mongoose";
import { auditActions, type AuditAction } from "@family/core";

export interface AuditLogDocument extends Document {
  actorId: mongoose.Types.ObjectId | null;
  actorName: string | null;
  action: AuditAction;
  targetType: string | null;
  targetId: mongoose.Types.ObjectId | null;
  details: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new mongoose.Schema<AuditLogDocument>(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actorName: { type: String, default: null },
    action: { type: String, required: true, enum: auditActions },
    targetType: { type: String, default: null },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });

export const AuditLog: Model<AuditLogDocument> = mongoose.model<AuditLogDocument>(
  "AuditLog",
  auditLogSchema,
);