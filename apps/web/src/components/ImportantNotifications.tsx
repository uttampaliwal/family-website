import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

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

// Translation map for notification messages
const notificationTranslations: Record<string, Record<string, string>> = {
  "New Feature Announcement": {
    en: "New Feature Announcement",
    hi: "नई सुविधा की घोषणा",
  },
  "We have just launched a new feature that you might like!": {
    en: "We have just launched a new feature that you might like!",
    hi: "हमने अभी एक नई सुविधा लॉन्च की है जो आपको पसंद आ सकती है!",
  },
  "Scheduled Maintenance": {
    en: "Scheduled Maintenance",
    hi: "निर्धारित रखरखाव",
  },
  "The system will be down for scheduled maintenance on Saturday at 10 PM.": {
    en: "The system will be down for scheduled maintenance on Saturday at 10 PM.",
    hi: "सिस्टम शनिवार को शाम 10 बजे निर्धारित रखरखाव के लिए बंद रहेगा।",
  },
};

const ImportantNotifications: React.FC = () => {
  const { i18n } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const translateNotification = useCallback(
    (notification: Notification): Notification => {
      const currentLang = i18n.language === "hi" ? "hi" : "en";
      return {
        ...notification,
        title:
          notificationTranslations[notification.title]?.[currentLang] ||
          notification.title,
        message:
          notificationTranslations[notification.message]?.[currentLang] ||
          notification.message,
      };
    },
    [i18n.language],
  );

  const getLocale = useCallback((lang: string) => {
    switch (lang) {
      case "hi":
        return "hi-IN";
      case "en":
        return "en-US";
      default:
        return lang;
    }
  }, []);

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL || "";
    const url = `${base ? base : ""}/api/notifications/important`;

    const fetchWithRetry = async (attempt = 1): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        clearTimeout(timeoutId);
        if (res.ok) return res;
        if (attempt < 3 && res.status >= 500) {
          await new Promise((r) => setTimeout(r, 500 * attempt));
          return fetchWithRetry(attempt + 1);
        }
        throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        clearTimeout(timeoutId);
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 500 * attempt));
          return fetchWithRetry(attempt + 1);
        }
        throw err;
      }
    };

    const load = async () => {
      try {
        const response = await fetchWithRetry();
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        const msg = (() => {
          if (!(error instanceof Error)) return "Failed to load notifications";
          const map: Record<string, string> = {
            "404": "Notifications service not available.",
            "403": "You do not have permission to view notifications.",
            "401": "You do not have permission to view notifications.",
            "500": "Server error. Please try again later.",
            aborted: "Request timed out. Please try again.",
            network: "Network error. Please check your connection.",
          };
          const text = error.message.toLowerCase();
          for (const [key, val] of Object.entries(map)) {
            if (text.includes(key)) return val;
          }
          return "An unexpected error occurred. Please try again.";
        })();
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const getNotificationStyles = useCallback((type: Notification["type"]) => {
    return NOTIFICATION_STYLES[type] || NOTIFICATION_STYLES.info;
  }, []);

  const sanitizedNotifications = useMemo(() => {
    return notifications.map((notification) => {
      const translated = translateNotification(notification);
      return {
        ...translated,
        title: sanitizeString(translated.title),
        message: sanitizeString(translated.message),
        action: translated.action
          ? {
              ...translated.action,
              label: sanitizeString(translated.action.label),
            }
          : undefined,
      };
    });
  }, [notifications, translateNotification]);

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
                <h3 className="subheadline text-text-base">
                  {notification.title}
                </h3>
                <p className="mt-1 text-readable-muted">
                  {notification.message}
                </p>
                <time className="block mt-2 text-sm text-muted">
                  {new Date(notification.timestamp).toLocaleString(
                    getLocale(i18n.language),
                  )}
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
