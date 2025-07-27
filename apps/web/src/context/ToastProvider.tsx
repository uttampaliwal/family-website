import React, { useState, type ReactNode, useCallback } from 'react';
import Toast from '../components/Toast';

import { ToastContext } from './ToastContext';

// Types for better maintainability
type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  }, []);

  const handleClose = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <Toast message={toast.message} type={toast.type} onClose={handleClose} />}
    </ToastContext.Provider>
  );
};
