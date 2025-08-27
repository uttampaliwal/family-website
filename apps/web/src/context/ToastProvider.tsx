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

    const trimmedMessage = message.trim();

    setToasts((prev) => {
      // Check for duplicate messages (same message and type within last 3 seconds)
      const now = Date.now();
      const isDuplicate = prev.some((toast) => {
        const toastTime = parseInt(toast.id.split(".")[0]);
        return (
          toast.message === trimmedMessage &&
          toast.type === type &&
          now - toastTime < 3000
        ); // Extended to 3 seconds for better deduplication
      });

      if (isDuplicate) {
        return prev; // Don't add duplicate toast
      }

      const id = now.toString() + "." + Math.random().toString(36).substr(2, 9);
      const newToast = { id, message: trimmedMessage, type };

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
