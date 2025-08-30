import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  PaperAirplaneIcon,
  EllipsisVerticalIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../hooks/useAuth";
import api from "../services/axios";

interface Message {
  _id: string;
  sender: {
    _id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  type: "text" | "image" | "file";
  createdAt: string;
  readBy: Array<{
    user: string;
    readAt: string;
  }>;
  editedAt?: string;
}

interface ChatWindowProps {
  chatId: string;
  friendName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  chatId,
  friendName,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && chatId) {
      fetchMessages();
    }
  }, [isOpen, chatId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/chat/${chatId}/messages`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await api.post(`/api/chat/${chatId}/messages`, {
        content: newMessage.trim(),
        type: "text",
      });

      setMessages((prev) => [...prev, response.data.message]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};

    messages.forEach((message) => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-4 right-4 w-80 h-96 bg-surface rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 rounded-t-lg bg-primary text-white">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center text-sm font-medium">
                {friendName.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <h3 className="font-medium">{friendName}</h3>
                <p className="text-xs opacity-90">Online</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-1 hover:bg-white/20 rounded">
                <EllipsisVerticalIcon className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              Object.entries(messageGroups).map(([date, dayMessages]) => (
                <div key={date}>
                  {/* Date separator */}
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full text-xs text-text-muted">
                      {formatDate(date)}
                    </div>
                  </div>

                  {/* Messages for this date */}
                  {dayMessages.map((message) => {
                    const isOwn = message.sender._id === user?.id;
                    return (
                      <motion.div
                        key={message._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}
                      >
                        <div
                          className={`max-w-xs ${isOwn ? "order-2" : "order-1"}`}
                        >
                          <div
                            className={`px-3 py-2 rounded-lg ${
                              isOwn
                                ? "bg-primary text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-text-base"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwn ? "text-white/70" : "text-text-muted"
                              }`}
                            >
                              {formatTime(message.createdAt)}
                              {message.editedAt && " (edited)"}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form
            onSubmit={sendMessage}
            className="p-4 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="p-2 text-text-muted hover:text-text-base transition-colors"
              >
                <PhotoIcon className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-text-base"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatWindow;
