import mongoose, { type Document, type Model } from "mongoose";
import { postBodyMaxLength } from "@family/core";

export interface CommentSubDoc extends Document {
  body: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface PostDocument extends Document {
  body: string;
  createdBy: mongoose.Types.ObjectId;
  likedBy: mongoose.Types.ObjectId[];
  comments: mongoose.Types.DocumentArray<CommentSubDoc>;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new mongoose.Schema<PostDocument>(
  {
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: postBodyMaxLength,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    comments: [
      {
        body: { type: String, required: true, trim: true, maxlength: 500 },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
  },
  { timestamps: true },
);

postSchema.index({ createdAt: -1 });
postSchema.index({ createdBy: 1 });

export const Post: Model<PostDocument> = mongoose.model<PostDocument>(
  "Post",
  postSchema,
);