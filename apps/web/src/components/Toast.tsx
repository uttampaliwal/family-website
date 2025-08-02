import React, { useEffect, useState } from 'react';
import { sanitizeText } from '../utils/sanitization';

// Constants for better maintainability
const TOAST_DURATION = 3000;
const TOAST_STYLES = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
} as const;

const BASE_CLASSES = 'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white transition-opacity duration-300';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = TOAST_STYLES[type];

  if (!isVisible) return null;

  return (
    <div
      className={`${BASE_CLASSES} ${bgColor}`}
      role="alert"
    >
      {sanitizeText(message)}
    </div>
  );
};

export default Toast;
