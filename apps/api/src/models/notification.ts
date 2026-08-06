import mongoose, { type Document, type Model } from "mongoose";
import { notificationTypes } from "@family/core";

export interface NotificationDocument extends Document {
  recipientId: mongoose.Types.ObjectId;
  type: (typeof notificationTypes)[number];
  actorId: mongoose.Types.ObjectId | null;
  actorName: string | null;
  body: string;
  link: string;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new mongoose.Schema<NotificationDocument>(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: { type: String, required: true, enum: notificationTypes },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actorName: { type: String, default: null },
    body: { type: String, default: "" },
    link: { type: String, required: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, readAt: 1 });

export const Notification: Model<NotificationDocument> = mongoose.model<NotificationDocument>(
  "Notification",
  notificationSchema,
);