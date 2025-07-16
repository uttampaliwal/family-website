import React, { useEffect, useState } from 'react';

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
    }, 3000); // Toast disappears after 3 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }[type];

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white ${bgColor} transition-opacity duration-300`}
      role="alert"
    >
      {message}
    </div>
  );
};

export default Toast;
