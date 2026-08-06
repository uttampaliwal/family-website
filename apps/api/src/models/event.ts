import mongoose, { type Document, type Model } from "mongoose";

export interface EventDocument extends Document {
  title: string;
  type: string;
  startsAt: Date;
  endsAt?: Date;
  description?: string;
  recurrence: "none" | "yearly";
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new mongoose.Schema<EventDocument>(
  {
    title: { type: String, required: true, maxlength: 100 },
    type: { type: String, required: true, enum: ["birthday", "anniversary", "gathering", "ceremony", "other"] },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, default: undefined },
    description: { type: String, maxlength: 500, default: undefined },
    recurrence: { type: String, enum: ["none", "yearly"], default: "none" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

eventSchema.index({ startsAt: 1 });
eventSchema.index({ createdBy: 1 });

export const Event: Model<EventDocument> = mongoose.model<EventDocument>(
  "Event",
  eventSchema,
);