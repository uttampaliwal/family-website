import mongoose, { type Document, type Model } from "mongoose";
import { announcementBodyMaxLength } from "@family/core";

export interface AnnouncementDocument extends Document {
  title: string;
  body: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new mongoose.Schema<AnnouncementDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: announcementBodyMaxLength,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ createdBy: 1 });

export const Announcement: Model<AnnouncementDocument> =
  mongoose.model<AnnouncementDocument>("Announcement", announcementSchema);
