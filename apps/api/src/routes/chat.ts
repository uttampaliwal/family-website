import type {
  ChatMessage as ChatMessagePayload,
  ChatRoom as ChatRoomPayload,
} from "@family/core";
import {
  createRoomRequestSchema,
  sendMessageRequestSchema,
} from "@family/core";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import mongoose from "mongoose";
import { logger } from "../lib/logger.js";
import {
  publishChatEvent,
  subscribeChat,
  subscriberCount,
} from "../lib/sse.js";
import { parseObjectIdParam, validateBody } from "../lib/validation.js";
import { AppError } from "../middleware/error.js";
import {
  originCheck,
  rateLimit,
  requireCapability,
} from "../middleware/security.js";
import { ChatMessage } from "../models/message.js";
import { Room, type RoomDocument } from "../models/room.js";

export const chatRoutes = new Hono();

chatRoutes.use("*", originCheck, requireCapability("chat"));

// ─── Rooms ────────────────────────────────────────────────────────────

chatRoutes.get("/rooms", async (c) => {
  const viewerId = c.get("userId");

  const rooms = await Room.find().sort({ createdAt: -1 }).limit(100).lean();
  const items = await Promise.all(
    rooms.map((room) => toRoomPayload(`${room._id}`, viewerId)),
  );
  return c.json({ items, total: items.length });
});

chatRoutes.post(
  "/rooms",
  requireCapability("createRooms"),
  validateBody(createRoomRequestSchema),
  async (c) => {
    const userId = c.get("userId");
    const { name } = c.req.valid("json");

    const room = await Room.create({ name, createdBy: userId });
    return c.json({ room: await toRoomPayload(room._id.toString(), userId) });
  },
);

chatRoutes.get("/rooms/:id", async (c) => {
  const room = await findRoom(parseObjectIdParam(c));
  return c.json({
    room: await toRoomPayload(room._id.toString(), c.get("userId")),
  });
});

// ─── Messages ─────────────────────────────────────────────────────────

/** Newest first; the client reverses for display. */
chatRoutes.get("/rooms/:id/messages", async (c) => {
  const roomId = parseObjectIdParam(c);
  await findRoom(roomId);

  const messages = (await ChatMessage.find({ roomId })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("createdBy", "name username")
    .lean()) as unknown as PopulatedMessage[];

  const items = messages.map((message) => toMessagePayload(message));
  return c.json({ items, total: items.length });
});

chatRoutes.post(
  "/rooms/:id/messages",
  rateLimit({ windowMs: 60_000, max: 60, name: "chat-message" }),
  requireCapability("chat"),
  validateBody(sendMessageRequestSchema),
  async (c) => {
    const userId = c.get("userId");
    const roomId = parseObjectIdParam(c);
    const { body } = c.req.valid("json");

    await findRoom(roomId);

    const message = await ChatMessage.create({
      roomId,
      body,
      createdBy: userId,
    });

    const populated = (await ChatMessage.findById(message._id)
      .populate("createdBy", "name username")
      .lean()) as unknown as PopulatedMessage;

    const payload = toMessagePayload(populated);
    publishChatEvent({ type: "message", roomId, message: payload });

    return c.json({ message: payload });
  },
);

// ─── Read state (drives unread counts) ────────────────────────────────

chatRoutes.post("/rooms/:id/read", async (c) => {
  const userId = c.get("userId");
  const roomId = parseObjectIdParam(c);

  const room = await findRoom(roomId);
  await Room.updateOne(
    { _id: room._id, "readBy.userId": userId },
    { $set: { "readBy.$.at": new Date() } },
  );
  if (
    room.readBy.findIndex((entry) => entry.userId.toString() === userId) === -1
  ) {
    await Room.updateOne(
      { _id: room._id },
      {
        $push: {
          readBy: {
            userId: new mongoose.Types.ObjectId(userId),
            at: new Date(),
          },
        },
      },
    );
  }

  return c.json({ ok: true });
});

// ─── Real-time stream ─────────────────────────────────────────────────

/**
 * Server-Sent Events. The web client connects with fetch + a bearer token
 * (EventSource cannot send headers) and re-fetches history on reconnect.
 */
chatRoutes.get("/events", async (c) => {
  const viewerId = c.get("userId");
  logger.info({ viewerId, listeners: subscriberCount() }, "chat SSE connected");

  return streamSSE(c, async (stream) => {
    const unsubscribe = subscribeChat((payload) => {
      void stream.writeSSE({ data: payload });
    });

    const heartbeat = setInterval(() => {
      void stream.writeSSE({ data: JSON.stringify({ type: "ping" }) });
    }, 25_000);

    await new Promise<void>((resolve) => {
      stream.onAbort(() => resolve());
    });

    clearInterval(heartbeat);
    unsubscribe();
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────

export interface PopulatedAuthor {
  _id: { toString(): string };
  name: string;
  username: string;
}

export interface PopulatedMessage {
  _id: unknown;
  roomId: { toString(): string };
  body: string;
  createdBy: PopulatedAuthor;
  createdAt: Date;
}

export function toMessagePayload(
  message: PopulatedMessage,
): ChatMessagePayload {
  return {
    id: String(message._id),
    roomId: String(message.roomId),
    body: message.body,
    createdBy: {
      id: message.createdBy._id.toString(),
      name: message.createdBy.name,
      username: message.createdBy.username,
    },
    createdAt: message.createdAt,
  };
}

async function findRoom(roomId: string): Promise<RoomDocument> {
  const room = await Room.findById(roomId);
  if (!room) throw new AppError(404, "NOT_FOUND", "Room not found");
  return room;
}

async function toRoomPayload(
  roomId: string,
  viewerId: string,
): Promise<ChatRoomPayload> {
  const room = (await Room.findById(roomId)
    .populate("createdBy", "name username")
    .lean()) as unknown as {
    _id: unknown;
    name: string;
    createdBy: PopulatedAuthor;
    readBy: { userId: { toString(): string }; at: Date }[];
    createdAt: Date;
  } | null;

  if (!room) throw new AppError(404, "NOT_FOUND", "Room not found");

  const lastMessage = await ChatMessage.findOne({ roomId })
    .sort({ createdAt: -1 })
    .populate("createdBy", "name username")
    .lean();

  const readAt =
    room.readBy.find((entry) => entry.userId.toString() === viewerId)?.at ??
    null;

  const unreadCount = await ChatMessage.countDocuments({
    roomId,
    createdBy: { $ne: viewerId },
    ...(readAt ? { createdAt: { $gt: readAt } } : {}),
  });

  return {
    id: String(room._id),
    name: room.name,
    createdBy: {
      id: room.createdBy._id.toString(),
      name: room.createdBy.name,
      username: room.createdBy.username,
    },
    createdAt: room.createdAt,
    lastMessage: lastMessage
      ? toMessagePayload(lastMessage as unknown as PopulatedMessage)
      : null,
    unreadCount,
  };
}
