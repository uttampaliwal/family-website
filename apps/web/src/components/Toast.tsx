import React, { useEffect, useState } from "react";
import { sanitizeText } from "../utils/sanitization";

// Constants for better maintainability
const TOAST_DURATION = 4000;

// Toast styles aligned with unified theme system
const TOAST_STYLES = {
  success: "text-white border-2 shadow-lg toast-success",
  error: "text-white border-2 shadow-lg toast-error",
  info: "text-white border-2 shadow-lg toast-info",
  warning: "text-white border-2 shadow-lg toast-warning",
} as const;

// Enhanced base classes with better styling and animations
const BASE_CLASSES = `
  relative
  min-w-[320px] max-w-[480px] 
  p-4 rounded-xl 
  backdrop-blur-sm
  transition-all duration-500 ease-in-out
  transform
  font-medium
  flex items-center gap-3
`
  .replace(/\s+/g, " ")
  .trim();

// Toast icons for better visual feedback
const TOAST_ICONS = {
  success: "✅",
  error: "❌",
  info: "ℹ️",
  warning: "⚠️",
} as const;

interface ToastProps {
  message: string;
  type: "success" | "error" | "info" | "warning";
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onClose,
  duration = TOAST_DURATION,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const [progressTrigger, setProgressTrigger] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      // kick off progress animation shortly after mount
      setTimeout(() => setProgressTrigger(true), 50);
    }, 50);

    // Auto-hide timer
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      // Remove from DOM after animation
      setTimeout(() => {
        setShouldRender(false);
        onClose();
      }, 500);
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [onClose, duration]);

  const handleClick = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShouldRender(false);
      onClose();
    }, 500);
  };

  if (!shouldRender) return null;

  const styleClasses = TOAST_STYLES[type];
  const icon = TOAST_ICONS[type];

  // Animation classes
  const animationClasses = isVisible
    ? "translate-x-0 opacity-100 scale-100"
    : "translate-x-full opacity-0 scale-95";

  return (
    <div
      className={`${BASE_CLASSES} ${styleClasses} ${animationClasses} cursor-pointer hover:scale-105`}
      role="status"
      onClick={handleClick}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="text-xl flex-shrink-0" aria-hidden="true">
        {icon}
      </span>
      <div className="flex-1 text-sm leading-relaxed">
        {sanitizeText(message)}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        className="flex-shrink-0 text-white/80 hover:text-white text-lg font-bold ml-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
        aria-label="Close notification"
      >
        ×
      </button>
      {/* Progress bar */}
      <div
        className="absolute left-0 right-0 bottom-0 h-1/2 rounded-b-xl overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="h-[2px] bg-white/80"
          style={{
            width: progressTrigger ? "0%" : "100%",
            transition: `width ${duration}ms linear`,
          }}
        />
      </div>
    </div>
  );
};

export default Toast;
