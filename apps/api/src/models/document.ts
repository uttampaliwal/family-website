import { MAX_DOCUMENT_SIZE } from "@family/core";
import mongoose, { type Document, type Model } from "mongoose";

export interface DocumentDocument extends Document {
  key: string;
  name: string;
  mimeType: string;
  size: number;
  description?: string;
  shareToken?: string;
  /** Client-computed SHA-256 of the stored bytes (reconciliation). */
  sha256?: string;
  /** Soft delete (Trash): set instead of removing the row. */
  deletedAt?: Date;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new mongoose.Schema<DocumentDocument>(
  {
    key: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    mimeType: { type: String, required: true },
    size: {
      type: Number,
      required: true,
      min: 1,
      max: MAX_DOCUMENT_SIZE,
    },
    description: { type: String, default: undefined, maxlength: 500 },
    // Single revocable public share link per document.
    shareToken: { type: String, default: undefined },
    sha256: { type: String, default: undefined },
    deletedAt: { type: Date, default: undefined },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

documentSchema.index({ key: 1 }, { unique: true });
documentSchema.index({ createdAt: -1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ shareToken: 1 }, { unique: true, sparse: true });

export const KulayaDocument: Model<DocumentDocument> =
  mongoose.model<DocumentDocument>("Document", documentSchema);
