import React, { useEffect, useState } from "react";
import { sanitizeText } from "../utils/sanitization";

// Constants for better maintainability
const TOAST_DURATION = 3000;
const TOAST_STYLES = {
  success: "bg-green-500",
  error: "bg-red-500",
  info: "bg-blue-500",
} as const;

const BASE_CLASSES =
  "fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg text-white transition-opacity duration-300 z-50";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onClose,
  duration = TOAST_DURATION,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColor = TOAST_STYLES[type];

  if (!isVisible) return null;

  return (
    <div className={`${BASE_CLASSES} ${bgColor}`} role="alert">
      {sanitizeText(message)}
    </div>
  );
};

export default Toast;
