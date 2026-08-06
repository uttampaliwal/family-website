import { z } from "zod";
import { name, objectId } from "./common.js";

export const roomNameSchema = z
  .string()
  .trim()
  .min(1, "Room name is required")
  .max(60, "Room name can be at most 60 characters");

export const messageBodySchema = z
  .string()
  .trim()
  .min(1, "Say something first")
  .max(2000, "Messages can be at most 2000 characters");

export const createRoomRequestSchema = z.object({
  name: roomNameSchema,
});

export const sendMessageRequestSchema = z.object({
  body: messageBodySchema,
});

export const chatAuthorSchema = z.object({
  id: objectId,
  name,
  username: z.string(),
});

export const chatMessageSchema = z.object({
  id: objectId,
  roomId: objectId,
  body: z.string(),
  createdBy: chatAuthorSchema,
  createdAt: z.coerce.date(),
});

export const chatRoomSchema = z.object({
  id: objectId,
  name: roomNameSchema,
  createdBy: chatAuthorSchema,
  createdAt: z.coerce.date(),
  lastMessage: chatMessageSchema.nullable(),
  unreadCount: z.number().int().nonnegative(),
});

export const chatRoomListResponseSchema = z.object({
  items: z.array(chatRoomSchema),
  total: z.number().int().nonnegative(),
});

export const chatMessageListResponseSchema = z.object({
  items: z.array(chatMessageSchema),
  total: z.number().int().nonnegative(),
});

export type CreateRoomInput = z.infer<typeof createRoomRequestSchema>;
export type SendMessageInput = z.infer<typeof sendMessageRequestSchema>;
export type ChatRoom = z.infer<typeof chatRoomSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRoomListResponse = z.infer<typeof chatRoomListResponseSchema>;
export type ChatMessageListResponse = z.infer<typeof chatMessageListResponseSchema>;