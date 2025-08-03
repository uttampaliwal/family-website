import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext';

const TOAST_CONTEXT_ERROR = 'useToast must be used within a ToastProvider';

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error(TOAST_CONTEXT_ERROR);
  }
  return context;
};
