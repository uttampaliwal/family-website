import { Request, Response } from "express";
import Chat, { IChat, IReadBy } from "../models/Chat";
import { IUser } from "../models/User";
import { logger } from "../utils/logger";
import mongoose from "mongoose";

export const getChats = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const currentUserId = (req.user as IUser)?.id;

    const chats = await Chat.find({
      "participants.user": currentUserId,
      isActive: true,
    })
      .populate("participants.user", "username avatar isOnline lastSeen")
      .populate("group", "name avatar")
      .sort({ lastActivity: -1 })
      .exec();

    // Get last message for each chat
    const chatsWithLastMessage = await Promise.all(
      chats.map(async (chat) => {
        const lastMessage =
          chat.messages.length > 0
            ? chat.messages[chat.messages.length - 1]
            : null;

        return {
          ...chat.toObject(),
          lastMessage,
          unreadCount: chat.messages.filter(
            (msg) =>
              !msg.readBy.some(
                (read) => (read as IReadBy).user?.toString() === currentUserId,
              ),
          ).length,
        };
      }),
    );

    return res.json({ chats: chatsWithLastMessage });
  } catch (error) {
    logger.error({ err: error }, "Error getting chats");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createChat = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { participantIds, groupId, name } = req.body;
    const currentUserId = (req.user as IUser)?.id;

    let chatType: "direct" | "group";
    let participants: { user: string | undefined; role: string }[];

    if (groupId) {
      // Group chat
      chatType = "group";
      participants = participantIds.map((id: string) => ({
        user: id,
        role: "member",
      }));
    } else {
      // Direct chat
      if (participantIds.length !== 1) {
        return res.status(400).json({
          message: "Direct chat must have exactly one other participant",
        });
      }

      chatType = "direct";
      participants = [
        { user: currentUserId, role: "member" },
        { user: participantIds[0], role: "member" },
      ];

      // Check if direct chat already exists
      const existingChat = await Chat.findOne<IChat>({
        type: "direct",
        "participants.user": { $all: [currentUserId, participantIds[0]] },
      });

      if (existingChat) {
        return res.status(400).json({ message: "Direct chat already exists" });
      }
    }

    const chat = new Chat({
      name,
      type: chatType,
      participants,
      group: groupId || undefined,
      messages: [],
    });

    await chat.save();

    const populatedChat = await Chat.findById<IChat>(chat._id)
      .populate("participants.user", "username avatar isOnline")
      .populate("group", "name avatar")
      .exec();

    return res.status(201).json({ chat: populatedChat });
  } catch (error) {
    logger.error({ err: error }, "Error creating chat");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getChatMessages = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const currentUserId = (req.user as IUser)?.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(
      (p) => p.user.toString() === currentUserId,
    );
    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get messages with pagination
    const skip = (Number(page) - 1) * Number(limit);
    const messages = chat.messages
      .filter((msg) => !msg.isDeleted)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(skip, skip + Number(limit))
      .reverse(); // Reverse to show oldest first

    // Populate sender information
    await Chat.populate(messages, {
      path: "sender",
      select: "username avatar",
    });

    return res.json({
      messages,
      hasMore: chat.messages.length > skip + Number(limit),
    });
  } catch (error) {
    logger.error({ err: error }, "Error getting chat messages");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const sendMessage = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { chatId } = req.params;
    const { content, type = "text", attachments = [] } = req.body;
    const currentUserId = (req.user as IUser)?.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(
      (p) => p.user.toString() === currentUserId,
    );
    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    const message = {
      sender: currentUserId,
      content,
      type,
      attachments,
      readBy: [{ user: new mongoose.Types.ObjectId(currentUserId) }], // Mark as read by sender
    };

    // TypeScript workaround for Mongoose subdocument array typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (chat.messages as any).push(message);
    chat.lastActivity = new Date();
    await chat.save();

    // Get the created message with populated sender
    const createdMessage = chat.messages[chat.messages.length - 1];
    await Chat.populate(createdMessage, {
      path: "sender",
      select: "username avatar",
    });

    return res.status(201).json({ message: createdMessage });
  } catch (error) {
    logger.error({ err: error }, "Error sending message");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const markAsRead = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { chatId, messageId } = req.params;
    const currentUserId = (req.user as IUser)?.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(
      (p) => p.user.toString() === currentUserId,
    );
    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    const message = chat.messages.find(
      (msg) => msg._id?.toString() === messageId,
    );
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if already marked as read
    const alreadyRead = message.readBy.some(
      (read) => (read as IReadBy).user?.toString() === currentUserId,
    );
    if (!alreadyRead) {
      message.readBy.push({
        user: new mongoose.Types.ObjectId(currentUserId),
      } as IReadBy);
      await chat.save();
    }

    return res.json({ message: "Message marked as read" });
  } catch (error) {
    logger.error({ err: error }, "Error marking message as read");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteMessage = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { chatId, messageId } = req.params;
    const currentUserId = (req.user as IUser)?.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const message = chat.messages.find(
      (msg) => msg._id?.toString() === messageId,
    );
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is the sender or admin
    if (message.sender.toString() !== currentUserId) {
      return res
        .status(403)
        .json({ message: "Can only delete your own messages" });
    }

    message.isDeleted = true;
    await chat.save();

    return res.json({ message: "Message deleted successfully" });
  } catch (error) {
    logger.error({ err: error }, "Error deleting message");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const editMessage = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { chatId, messageId } = req.params;
    const { content } = req.body;
    const currentUserId = (req.user as IUser)?.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const message = chat.messages.find(
      (msg) => msg._id?.toString() === messageId,
    );
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is the sender
    if (message.sender.toString() !== currentUserId) {
      return res
        .status(403)
        .json({ message: "Can only edit your own messages" });
    }

    message.content = content;
    message.editedAt = new Date();
    await chat.save();

    return res.json({ message: "Message updated successfully" });
  } catch (error) {
    logger.error({ err: error }, "Error editing message");
    return res.status(500).json({ message: "Internal server error" });
  }
};
