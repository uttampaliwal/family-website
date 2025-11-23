import express from "express";
import {
  getChats,
  createChat,
  getChatMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
  editMessage,
} from "../controllers/chatController.js";
import { protect as authMiddleware } from "../middleware/authMiddleware";
import { authRateLimit } from "../middleware/security.js";

const router = express.Router();

// Apply authentication to all chat routes
router.use(authMiddleware);

// Chat Management Routes
router.get("/", getChats);
router.post("/", authRateLimit, createChat);
router.get("/:chatId/messages", getChatMessages);
router.post("/:chatId/messages", authRateLimit, sendMessage);
router.post("/:chatId/messages/:messageId/read", markAsRead);
router.delete("/:chatId/messages/:messageId", authRateLimit, deleteMessage);
router.put("/:chatId/messages/:messageId", authRateLimit, editMessage);

export default router;
