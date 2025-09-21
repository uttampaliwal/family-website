import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

// Constants for better maintainability
const REDIRECT_DELAY = 3000;
const MESSAGES = {
  VERIFYING: import.meta.env.VITE_MSG_VERIFYING || "Verifying your email...",
  TOKEN_NOT_FOUND:
    import.meta.env.VITE_MSG_TOKEN_NOT_FOUND || "Verification token not found.",
  SUCCESS:
    import.meta.env.VITE_MSG_SUCCESS ||
    "Email verified successfully! You can now login.",
  BAD_REQUEST: import.meta.env.VITE_MSG_BAD_REQUEST || "Bad Request.",
  SERVER_ERROR:
    import.meta.env.VITE_MSG_SERVER_ERROR ||
    "Server error. Please try again later.",
  NETWORK_ERROR:
    import.meta.env.VITE_MSG_NETWORK_ERROR ||
    "Network error. Please check your internet connection or try again later.",
  CANCELLED:
    import.meta.env.VITE_MSG_CANCELLED ||
    "Request was cancelled. Please try again.",
  GENERIC_ERROR:
    import.meta.env.VITE_MSG_GENERIC_ERROR ||
    "An error occurred during verification. Please try again.",
  UNEXPECTED_ERROR:
    import.meta.env.VITE_MSG_UNEXPECTED_ERROR ||
    "An unexpected error occurred.",
} as const;

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string>(MESSAGES.VERIFYING);
  const [isError, setIsError] = useState<boolean>(false);
  const hasVerified = useRef(false);

  const getXsrfToken = () => {
    const cookies = document.cookie.split("; ");
    const xsrfCookie = cookies.find((row) => row.startsWith("XSRF-TOKEN="));
    return xsrfCookie?.split("=")[1];
  };

  const handleVerificationSuccess = useCallback(
    (data: { message?: string }) => {
      setMessage(data.message || MESSAGES.SUCCESS);
      setTimeout(() => navigate("/login"), REDIRECT_DELAY);
    },
    [navigate],
  );

  const handleVerificationError = (
    response: Response,
    data: { message?: string },
  ) => {
    let errorMessage: string;

    switch (response.status) {
      case 400:
        errorMessage = data.message || MESSAGES.BAD_REQUEST;
        break;
      case 401:
      case 403:
        errorMessage = "Invalid or expired verification token.";
        break;
      case 404:
        errorMessage = "Verification token not found.";
        break;
      case 500:
      case 502:
      case 503:
        errorMessage = MESSAGES.SERVER_ERROR;
        break;
      default:
        errorMessage = data.message || MESSAGES.UNEXPECTED_ERROR;
    }

    setMessage(errorMessage);
    setIsError(true);
  };

  const verifyEmail = useCallback(
    async (token: string) => {
      try {
        // Verifying email with provided token

        // First get CSRF token
        const csrfResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/csrf-token`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!csrfResponse.ok) {
          console.warn("Failed to get CSRF token, proceeding without it");
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/verify-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-XSRF-TOKEN": getXsrfToken() || "",
            },
            credentials: "include",
            body: JSON.stringify({ token: token.trim() }),
          },
        );

        const data = await response.json();
        // Email verification successful

        if (response.ok) {
          handleVerificationSuccess(data);
        } else {
          handleVerificationError(response, data);
        }
      } catch (error) {
        console.error("Verification error:", error);
        if (error instanceof TypeError) {
          setMessage(MESSAGES.NETWORK_ERROR);
        } else if (error instanceof Error && error.name === "AbortError") {
          setMessage(MESSAGES.CANCELLED);
        } else {
          setMessage(MESSAGES.GENERIC_ERROR);
        }
        setIsError(true);
      }
    },
    [handleVerificationSuccess],
  );

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setMessage(MESSAGES.TOKEN_NOT_FOUND);
      setIsError(true);
      return;
    }

    if (hasVerified.current) {
      return;
    }

    hasVerified.current = true;
    verifyEmail(token);
  }, [searchParams, verifyEmail]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header"></div>
        <div className="auth-form text-center">
          <h1 className="display-2 gradient-text mb-2">Email Verification</h1>
          <p
            role="alert"
            className={`${isError ? "text-error" : "text-success"}`}
          >
            {message}
          </p>
          {!isError && message.includes("successfully") && (
            <p className="text-muted mt-2">Redirecting to login page...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
