import mongoose, { Document } from "mongoose";

// Define interfaces for subdocuments
export interface IReadBy {
  user: mongoose.Types.ObjectId;
  readAt?: Date;
}

// Define the Message interface
export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  type: "text" | "image" | "file" | "system";
  attachments: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
  }[];
  readBy: IReadBy[];
  editedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Chat interface
export interface IChat extends Document {
  _id: mongoose.Types.ObjectId;
  name?: string;
  type: "direct" | "group";
  participants: {
    user: mongoose.Types.ObjectId;
    joinedAt: Date;
    leftAt?: Date;
    role: "member" | "admin";
  }[];
  group?: mongoose.Types.ObjectId;
  messages: IMessage[];
  lastMessage?: mongoose.Types.ObjectId;
  lastActivity: Date;
  settings: {
    muteNotifications: {
      user: mongoose.Types.ObjectId;
      mutedUntil?: Date;
    }[];
    allowFileSharing: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    type: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },
    attachments: [
      {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        url: String,
      },
    ],
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    editedAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const ChatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      maxlength: [100, "Chat name cannot exceed 100 characters"],
    },
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    participants: [
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
        leftAt: Date,
        role: {
          type: String,
          enum: ["member", "admin"],
          default: "member",
        },
      },
    ],
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    messages: [MessageSchema],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    settings: {
      muteNotifications: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          mutedUntil: Date,
        },
      ],
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
ChatSchema.index({ "participants.user": 1 });
ChatSchema.index({ group: 1 });
ChatSchema.index({ lastActivity: -1 });
ChatSchema.index({ type: 1 });

// For direct messages, ensure only 2 participants
ChatSchema.pre("save", function (next) {
  if (this.type === "direct" && this.participants.length !== 2) {
    next(new Error("Direct chats must have exactly 2 participants"));
  } else {
    next();
  }
});

export default mongoose.model<IChat>("Chat", ChatSchema);
