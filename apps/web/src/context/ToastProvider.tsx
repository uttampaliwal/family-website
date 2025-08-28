import React, { useState, type ReactNode, useCallback } from "react";
import Toast from "../components/Toast";

import { ToastContext } from "./ToastContext";

// Types for better maintainability
type ToastType = "success" | "error" | "info" | "warning";

interface ToastState {
  id: string;
  message: string;
  type: ToastType;
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    // Don't show empty messages
    if (!message.trim()) return;

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast = { id, message: message.trim(), type };

    setToasts((prev) => {
      // Limit to 3 toasts maximum
      const updated = [...prev, newToast];
      return updated.slice(-3);
    });
  }, []);

  const handleClose = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container - positioned to stack toasts */}
      <div
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] space-y-3 pointer-events-none w-full max-w-[560px] px-4"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="pointer-events-auto toast-item"
            style={{
              transform: `translateY(${index * 12}px)`,
              zIndex: 9999 - index,
            }}
          >
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => handleClose(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
