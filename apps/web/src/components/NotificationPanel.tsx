import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "family" | "document";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  avatar?: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "family",
      title: "New Family Member",
      message: "Sarah Johnson joined your family tree",
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: false,
      actionUrl: "/family-tree",
      actionText: "View Tree",
      avatar: "👩",
    },
    {
      id: "2",
      type: "document",
      title: "Document Shared",
      message: "Mom shared 'Wedding Photos 1995' with you",
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: false,
      actionUrl: "/documents/123",
      actionText: "View Document",
      avatar: "📸",
    },
    {
      id: "3",
      type: "info",
      title: "Storage Update",
      message: "You're using 75% of your storage space",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: true,
      actionUrl: "/storage",
      actionText: "Manage Storage",
      avatar: "💾",
    },
  ]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "family":
        return "bg-purple-500/20 border-purple-400/30";
      case "document":
        return "bg-blue-500/20 border-blue-400/30";
      case "success":
        return "bg-green-500/20 border-green-400/30";
      case "warning":
        return "bg-yellow-500/20 border-yellow-400/30";
      default:
        return "bg-gray-500/20 border-gray-400/30";
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-800/95 backdrop-blur-xl border-l border-white/20 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-white">Notifications</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200 text-white/60 hover:text-white"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                      {unreadCount}
                    </span>
                  )}
                  <span className="text-sm text-white/70">
                    {unreadCount > 0
                      ? `${unreadCount} unread`
                      : "All caught up!"}
                  </span>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-secondary hover:text-secondary/80 transition-colors duration-200"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">🔔</div>
                  <p className="text-white/60 mb-2">No notifications</p>
                  <p className="text-white/40 text-sm">You're all caught up!</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`p-4 rounded-xl border transition-all duration-200 hover:bg-white/5 ${
                        notification.read ? "bg-white/5" : "bg-white/10"
                      } ${getTypeColor(notification.type)}`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Avatar */}
                        <div className="text-2xl flex-shrink-0">
                          {notification.avatar}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3
                              className={`font-medium text-sm ${
                                notification.read
                                  ? "text-white/80"
                                  : "text-white"
                              }`}
                            >
                              {notification.title}
                            </h3>
                            <div className="flex items-center space-x-1 ml-2">
                              {!notification.read && (
                                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                              )}
                              <button
                                onClick={() =>
                                  deleteNotification(notification.id)
                                }
                                className="p-1 rounded hover:bg-white/10 transition-colors duration-200 text-white/40 hover:text-white/60"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>

                          <p
                            className={`text-sm mb-2 ${
                              notification.read
                                ? "text-white/60"
                                : "text-white/80"
                            }`}
                          >
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/50">
                              {formatTime(notification.timestamp)}
                            </span>

                            {notification.actionUrl && (
                              <Link
                                to={notification.actionUrl}
                                onClick={() => {
                                  markAsRead(notification.id);
                                  onClose();
                                }}
                                className="text-xs text-secondary hover:text-secondary/80 transition-colors duration-200 font-medium"
                              >
                                {notification.actionText}
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-white/5">
              <Link
                to="/notifications"
                onClick={onClose}
                className="block w-full text-center py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-200 text-white/80 hover:text-white text-sm font-medium"
              >
                View All Notifications
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;
