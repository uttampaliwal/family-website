import mongoose, { Document, Schema } from "mongoose";

export interface ICalendarEvent extends Document {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  participants: mongoose.Types.ObjectId[];
  category: string;
  color: string;
  createdBy: mongoose.Types.ObjectId;
}

const CalendarEventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    category: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  },
);

// Index for faster queries on startDate
CalendarEventSchema.index({ startDate: 1 });

export default mongoose.model<ICalendarEvent>(
  "CalendarEvent",
  CalendarEventSchema,
);
