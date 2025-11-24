/**
 * 🔄 LoadingState Component
 *
 * Reusable loading skeleton for consistent loading UX across the app
 */

import { motion } from "framer-motion";

interface LoadingStateProps {
  /**  Type of content being loaded */
  type?: "cards" | "list" | "page";
  /** Number of skeleton items to show */
  count?: number;
  /** Custom message */
  message?: string;
}

export function LoadingState({
  type = "cards",
  count = 6,
  message = "Loading...",
}: LoadingStateProps) {
  if (type === "page") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-text-muted">{message}</p>
        <span className="sr-only">{message}</span>
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className="space-y-4" role="status" aria-label={message}>
        <span className="sr-only">{message}</span>
        {Array.from({ length: count }).map((_, index) => (
          <motion.div
            key={index}
            className="animate-pulse card"
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            <div className="h-6 bg-surface rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-surface rounded w-full mb-2"></div>
            <div className="h-4 bg-surface rounded w-5/6"></div>
          </motion.div>
        ))}
      </div>
    );
  }

  // Default: cards
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      role="status"
      aria-label={message}
    >
      <span className="sr-only">{message}</span>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className="animate-pulse card h-48"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.8,
            delay: index * 0.1,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <div className="h-8 bg-surface rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-surface rounded w-full mb-2"></div>
          <div className="h-4 bg-surface rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-surface rounded w-5/6"></div>
        </motion.div>
      ))}
    </div>
  );
}

export default LoadingState;
