import mongoose, { Document, Schema } from 'mongoose';

export interface ICalendarEvent extends Document {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  participants?: string[];
  createdBy: mongoose.Schema.Types.ObjectId; // Reference to the User who created the event
  isPrivate: boolean;
}

const CalendarEventSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  location: { type: String },
  participants: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPrivate: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema);
