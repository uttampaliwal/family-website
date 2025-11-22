import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Link } from "react-router-dom";
import { createLogger } from "../utils/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

const logger = createLogger("ErrorBoundary");

class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Enhanced error logging with context
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack || "",
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem("userId") || "anonymous",
    };

    logger.error("ErrorBoundary caught an error:", errorDetails);

    // Send error to monitoring service in production
    if (import.meta.env.PROD) {
      this.reportError(errorDetails);
    }
  }

  private reportError = async (errorDetails: {
    message: string;
    stack?: string;
    componentStack: string;
    timestamp: string;
    userAgent: string;
    url: string;
    userId: string;
  }) => {
    try {
      // Send error report to backend for monitoring
      await fetch("/api/errors/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorDetails),
      });
    } catch (reportingError) {
      logger.error("Failed to report error:", reportingError);
    }
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-error/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-error"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-base mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-muted mb-6">
                We encountered an unexpected error. Don't worry, our team has
                been notified.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="btn btn-primary w-full"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-secondary w-full"
              >
                Reload Page
              </button>
              <Link to="/" className="btn btn-ghost w-full">
                Go Home
              </Link>
            </div>

            {/* Development error details */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-muted hover:text-base">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-background rounded border text-xs font-mono text-muted overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EnhancedErrorBoundary;
