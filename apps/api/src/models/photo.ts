import mongoose, { type Document, type Model } from "mongoose";

export interface PhotoDocument extends Document {
  key: string;
  mimeType: string;
  size: number;
  caption?: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const photoSchema = new mongoose.Schema<PhotoDocument>(
  {
    key: { type: String, required: true, unique: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    caption: { type: String, maxlength: 200, default: undefined },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

photoSchema.index({ uploadedBy: 1 });
photoSchema.index({ createdAt: -1 });

export const Photo: Model<PhotoDocument> = mongoose.model<PhotoDocument>(
  "Photo",
  photoSchema,
);
