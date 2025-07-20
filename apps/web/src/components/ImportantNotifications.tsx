import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'urgent';
  timestamp: string;
  action?: {
    label: string;
    url: string;
  };
}

const ImportantNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/important`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
        {error}
      </div>
    );
  }

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'bg-red-50 dark:bg-red-900/20 border-red-500';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-500';
    }
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`p-4 rounded-lg border-l-4 ${getNotificationStyles(notification.type)}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {notification.title}
                </h3>
                <p className="mt-1 text-gray-700 dark:text-gray-300">
                  {notification.message}
                </p>
                <time className="block mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(notification.timestamp).toLocaleString()}
                </time>
              </div>
              {notification.action && (
                <a
                  href={notification.action.url}
                  className="ml-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white dark:bg-gray-800 text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-700"
                >
                  {notification.action.label}
                  <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {notifications.length === 0 && (
        <div className="text-center p-8 text-gray-500 dark:text-gray-400">
          No important notifications at this time
        </div>
      )}
    </div>
  );
};

export default ImportantNotifications;