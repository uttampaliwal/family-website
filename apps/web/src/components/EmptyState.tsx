/**
 * 📭 Enhanced EmptyState Component
 *
 * Improved empty state component with better UX and animations
 */

import React from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../utils/animations";
import { sanitizeText } from "../utils/sanitization";

interface EmptyStateProps {
  /** Icon or emoji to display */
  icon?: string;
  /** Title of the empty state */
  title?: string;
  /** Message/description text */
  message: string;
  /** Action button text */
  actionLabel?: string;
  /** Action button click handler */
  onAction?: () => void;
  /** Show action button as secondary style */
  secondaryAction?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "📭",
  title,
  message,
  actionLabel,
  onAction,
  secondaryAction = false,
}) => {
  return (
    <div className="text-center py-12">
      <motion.div
        className="card max-w-md mx-auto"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
      >
        <div className="text-6xl mb-4" aria-hidden="true">
          {icon}
        </div>
        {title && (
          <h3 className="text-xl font-semibold text-text-base mb-2">
            {sanitizeText(title)}
          </h3>
        )}
        <p className="body-lg text-readable-muted mb-4">
          {sanitizeText(message)}
        </p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className={`btn ${secondaryAction ? "btn-secondary" : "btn-primary"}`}
          >
            {actionLabel}
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default EmptyState;
