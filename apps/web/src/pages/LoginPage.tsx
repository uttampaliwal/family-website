import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import api from "../services/axios";
import { ensureCsrfToken } from "../utils/csrf";
import type {
  LoginRequest,
  AuthResponse,
  ResendVerificationRequest,
  UserProfile,
} from "../types/api";
import { isAxiosError } from "axios";

const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [showResendButton, setShowResendButton] = useState<boolean>(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Toast clearing is now handled automatically by the ToastProvider
    setLoading(true);

    try {
      // Ensure CSRF token is available before making the request
      await ensureCsrfToken();

      const response = await api.post<AuthResponse>("/api/auth/login", {
        identifier,
        password,
      } as LoginRequest);

      const data = response.data;
      if (data.username) {
        localStorage.setItem("accessToken", data.accessToken || "");
        const userResponse = await api.get<UserProfile>(
          `/api/auth/profile/${data.username}`,
        );
        login(userResponse.data);
        showToast(data.message || "Login successful!", "success");
        navigate(`/profile/${data.username}`);
      } else {
        throw new Error("Invalid response: missing username");
      }
    } catch (error) {
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (isAxiosError(error)) {
        if (error.response) {
          if (error.response.status === 400 || error.response.status === 401) {
            if (typeof error.response.data === "string") {
              errorMessage = error.response.data;
            } else {
              errorMessage =
                error.response.data?.message || "Invalid credentials";
            }
            if (
              error.response.data?.message ===
              "Please verify your email before logging in."
            ) {
              setShowResendButton(true);
            }
          } else if (error.response.status >= 500) {
            errorMessage = "Server error. Please try again later.";
          } else {
            errorMessage =
              error.response.data?.message ||
              error.response.statusText ||
              errorMessage;
          }
        } else if (error.request) {
          errorMessage =
            "Network error. Please check your internet connection or try again later.";
        } else {
          errorMessage = error.message || errorMessage;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    // Note: Toast clearing is now handled automatically by the ToastProvider
    try {
      const response = await api.post<AuthResponse>(
        "/api/auth/resend-verification",
        {
          identifier,
        } as ResendVerificationRequest,
      );
      const data = response.data;
      showToast(
        data.message || "Verification email sent successfully!",
        "success",
      );
      setShowResendButton(false);
    } catch (error) {
      let errorMessage =
        "An error occurred while resending verification email.";

      if (isAxiosError(error)) {
        if (error.response) {
          if (error.response.status === 404) {
            errorMessage =
              "User not found. Please check your email or username.";
          } else if (error.response.status >= 500) {
            errorMessage = "Server error. Please try again later.";
          } else if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          }
        } else if (error.request) {
          errorMessage = "Network error. Please check your connection.";
        }
      }

      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="auth-card"
      >
        <div className="auth-header"></div>

        <div className="auth-form">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 gradient-text">
              Welcome Back
            </h1>
            <p className="text-muted">Sign in to continue to your account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-base mb-2"
              >
                Email or Username
              </label>
              <input
                type="text"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={loading}
                className="input"
                placeholder="Enter your email or username"
              />
            </div>

            <div className="mb-6 relative">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-base mb-2"
              >
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="input pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-muted hover:text-base focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                      clipRule="evenodd"
                    />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-base"
                >
                  Remember me
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary hover:text-secondary transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {showResendButton && (
            <div className="mt-4">
              <button
                onClick={handleResendVerification}
                disabled={loading}
                className="btn btn-ghost w-full"
              >
                Resend Verification Email
              </button>
            </div>
          )}

          <div className="text-center mt-6">
            <p className="text-muted">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-primary hover:text-secondary transition-colors"
              >
                Sign up now
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
