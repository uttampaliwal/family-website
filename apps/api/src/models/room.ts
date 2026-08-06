import mongoose, { type Document, type Model } from "mongoose";

export interface ReadByEntry {
  userId: mongoose.Types.ObjectId;
  at: Date;
}

export interface RoomDocument extends Document {
  name: string;
  createdBy: mongoose.Types.ObjectId;
  readBy: ReadByEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new mongoose.Schema<RoomDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readBy: [
      {
        _id: false,
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        at: { type: Date, required: true },
      },
    ],
  },
  { timestamps: true },
);

roomSchema.index({ createdAt: -1 });

export const Room: Model<RoomDocument> = mongoose.model<RoomDocument>(
  "Room",
  roomSchema,
);