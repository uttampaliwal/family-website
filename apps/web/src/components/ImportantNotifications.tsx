import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "urgent";
  timestamp: string;
  action?: {
    label: string;
    url: string;
  };
}

// Constants for better performance
const NOTIFICATION_STYLES = {
  urgent: "bg-error/10 border-error text-error",
  warning: "bg-warning/10 border-warning text-warning",
  info: "bg-info/10 border-info text-info",
} as const;

const sanitizeString = (str: string) => String(str).replace(/[<>"'&]/g, "");

const ImportantNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/notifications/important`,
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        // Structured error logging with context
        const errorInfo = {
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          operation: "fetchNotifications",
          url: `${import.meta.env.VITE_API_BASE_URL}/api/notifications/important`,
        };
        console.error(
          "Error fetching notifications:",
          JSON.stringify(errorInfo),
        );

        const getErrorMessage = (error: unknown): string => {
          if (!(error instanceof Error)) return "Failed to load notifications";

          const errorMap: Record<string, string> = {
            "404": "Notifications service not available.",
            "403": "You do not have permission to view notifications.",
            "401": "You do not have permission to view notifications.",
            "500": "Server error. Please try again later.",
            network: "Network error. Please check your connection.",
            fetch: "Network error. Please check your connection.",
          };

          for (const [key, message] of Object.entries(errorMap)) {
            if (error.message.toLowerCase().includes(key.toLowerCase())) {
              return message;
            }
          }

          return "An unexpected error occurred. Please try again.";
        };

        const errorMessage = getErrorMessage(error);

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const getNotificationStyles = useCallback((type: Notification["type"]) => {
    return NOTIFICATION_STYLES[type] || NOTIFICATION_STYLES.info;
  }, []);

  const sanitizedNotifications = useMemo(() => {
    return notifications.map((notification) => ({
      ...notification,
      title: sanitizeString(notification.title),
      message: sanitizeString(notification.message),
      action: notification.action
        ? {
          ...notification.action,
          label: sanitizeString(notification.action.label),
        }
        : undefined,
    }));
  }, [notifications]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-24 bg-surface rounded-lg animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {sanitizedNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`p-4 rounded-lg border ${getNotificationStyles(notification.type)} bg-surface`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="subheadline text-on-surface">
                  {notification.title}
                </h3>
                <p className="mt-1 text-readable-muted">
                  {notification.message}
                </p>
                <time className="block mt-2 text-sm text-muted">
                  {new Date(notification.timestamp).toLocaleString()}
                </time>
              </div>
              {notification.action && (
                <a
                  href={
                    /^https?:\/\//.test(notification.action.url)
                      ? notification.action.url
                      : "#"
                  }
                  className="ml-4 badge badge-primary hover:opacity-90 transition-opacity"
                  rel="noopener noreferrer"
                  target={
                    notification.action.url.startsWith("http")
                      ? "_blank"
                      : "_self"
                  }
                >
                  {notification.action.label}
                  <svg
                    className="ml-1 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {notifications.length === 0 && (
        <div className="text-center p-8 text-text-muted">
          No important notifications at this time
        </div>
      )}
    </div>
  );
};

export default ImportantNotifications;
