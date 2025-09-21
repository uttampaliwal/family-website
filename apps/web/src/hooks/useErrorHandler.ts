import { useCallback } from "react";

interface ErrorDetails {
  operation: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Custom hook for handling errors in a consistent way across the application
 * Replaces scattered console.error statements with structured error handling
 */
export const useErrorHandler = () => {
  const logError = useCallback((error: Error, details: ErrorDetails) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      operation: details.operation,
      userId: details.userId,
      metadata: details.metadata,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    if (process.env.NODE_ENV === "production") {
      // In production, send to error tracking service
      // TODO: Replace with actual error tracking service
      // Example: Sentry.captureException(error, { extra: errorData });
      console.error("Application Error:", errorData);
    } else {
      // Development logging with better formatting
      console.group(`🚨 Error in ${details.operation}`);
      console.error("Error:", error);
      console.table(details.metadata || {});
      console.groupEnd();
    }
  }, []);

  const handleAsyncError = useCallback(
    async <T>(
      asyncOperation: () => Promise<T>,
      errorDetails: ErrorDetails,
    ): Promise<T | null> => {
      try {
        return await asyncOperation();
      } catch (error) {
        logError(error as Error, errorDetails);
        return null;
      }
    },
    [logError],
  );

  return {
    logError,
    handleAsyncError,
  };
};

export default useErrorHandler;
