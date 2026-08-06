import mongoose, { type Document, type Model } from "mongoose";

export interface MessageDocument extends Document {
  roomId: mongoose.Types.ObjectId;
  body: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new mongoose.Schema<MessageDocument>(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

messageSchema.index({ roomId: 1, createdAt: -1 });

export const ChatMessage: Model<MessageDocument> = mongoose.model<MessageDocument>(
  "Message",
  messageSchema,
);