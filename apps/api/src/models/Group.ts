import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
      maxlength: [100, "Group name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    avatar: {
      type: String,
    },
    type: {
      type: String,
      enum: ["family", "friends", "work", "hobby", "other"],
      default: "family",
    },
    privacy: {
      type: String,
      enum: ["public", "private", "invite-only"],
      default: "private",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        role: {
          type: String,
          enum: ["member", "moderator"],
          default: "member",
        },
      },
    ],
    pendingInvites: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        invitedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        invitedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    settings: {
      allowMemberInvites: {
        type: Boolean,
        default: true,
      },
      requireApproval: {
        type: Boolean,
        default: false,
      },
      allowFileSharing: {
        type: Boolean,
        default: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better performance
GroupSchema.index({ owner: 1 });
GroupSchema.index({ "members.user": 1 });
GroupSchema.index({ type: 1, privacy: 1 });

export default mongoose.model("Group", GroupSchema);
