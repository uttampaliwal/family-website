/**
 * Centralized error logging utility for the frontend
 * Replaces console.error statements with structured logging
 */

interface ErrorContext {
  operation: string;
  userId?: string;
  component?: string;
  metadata?: Record<string, unknown>;
}

class ErrorLogger {
  private isDevelopment = import.meta.env.DEV;

  logError(error: Error | unknown, context: ErrorContext): void {
    const errorData = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      operation: context.operation,
      userId: context.userId,
      component: context.component,
      metadata: context.metadata,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    if (this.isDevelopment) {
      // Enhanced development logging
      console.group(`🚨 Error in ${context.operation}`);
      console.error("Error:", error);
      if (context.metadata) {
        console.table(context.metadata);
      }
      console.groupEnd();
    } else {
      // Production logging - ready for error tracking service
      // TODO: Replace with actual error tracking service (Sentry, etc.)
      console.error("Application Error:", errorData);
    }

    // Future: Send to error tracking service
    // this.sendToErrorService(errorData);
  }

  logWarning(message: string, context: Partial<ErrorContext>): void {
    const warningData = {
      level: "warning",
      message,
      operation: context.operation || "unknown",
      metadata: context.metadata,
      timestamp: new Date().toISOString(),
    };

    if (this.isDevelopment) {
      console.warn(`⚠️ Warning in ${context.operation || "unknown"}:`, message);
      if (context.metadata) {
        console.table(context.metadata);
      }
    } else {
      console.warn("Application Warning:", warningData);
    }
  }

  // Future enhancement: Send errors to monitoring service
  private sendToErrorService(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _errorData: Record<string, unknown>,
  ): void {
    // Example: Sentry.captureException(error, { extra: errorData });
    // Example: DataDog RUM integration
    // Example: Custom analytics endpoint
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Convenience functions
export const logError = (
  error: Error | unknown,
  operation: string,
  metadata?: Record<string, unknown>,
) => {
  errorLogger.logError(error, { operation, metadata });
};

export const logWarning = (
  message: string,
  operation: string,
  metadata?: Record<string, unknown>,
) => {
  errorLogger.logWarning(message, { operation, metadata });
};
