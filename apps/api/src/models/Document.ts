import mongoose, { Schema, Document as MongoDocument } from 'mongoose';

export interface IDocument extends MongoDocument {
  title: string;
  content: string;
  owner: mongoose.Types.ObjectId;
  sharedWith: mongoose.Types.ObjectId[];
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Add index for faster queries
  },
  sharedWith: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true // Add index for shared document queries
  }],
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  fileType: {
    type: String
  },
  fileSize: {
    type: Number
  }
}, {
  timestamps: true
});

// Create compound indexes for efficient document retrieval
DocumentSchema.index({ owner: 1, updatedAt: -1 });
DocumentSchema.index({ sharedWith: 1, updatedAt: -1 }); // For shared documents
DocumentSchema.index({ owner: 1, title: 1 }); // For title-based searches

export default mongoose.model<IDocument>('Document', DocumentSchema);