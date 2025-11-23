import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { isAxiosError } from "axios";
import { useToast } from "../hooks/useToast";
import { resetPassword as resetPasswordApi } from "../services/auth";

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { token: routeToken } = useParams<{ token: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const queryToken = new URLSearchParams(location.search).get("token");
  const token = routeToken || queryToken;

  useEffect(() => {
    if (!token) {
      showToast("Invalid or missing reset token", "error");
      setTimeout(() => navigate("/forgot-password"), 2000);
    }
  }, [token, navigate, showToast]);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push("at least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("one uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("one lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("one number");
    if (!/[^A-Za-z0-9]/.test(password)) errors.push("one special character");
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Toast clearing is now handled automatically by the ToastProvider
    setLoading(true);

    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      setLoading(false);
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      showToast(
        `Password must contain: ${passwordErrors.join(", ")}.`,
        "error",
      );
      setLoading(false);
      return;
    }

    try {
      if (!token || token.trim() === "") {
        throw new Error("Reset token is missing or invalid");
      }

      const response = await resetPasswordApi(password, token);

      if (!response || typeof response !== "object") {
        throw new Error("Invalid response from server");
      }

      showToast(response.message || "Password reset successful!", "success");
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      const getErrorMessage = (error: unknown): string => {
        if (isAxiosError(error)) {
          const status = error.response?.status;
          const errorData = error.response?.data;

          switch (status) {
            case 400:
              return errorData?.message || "Invalid or expired reset token";
            case 401:
              return "Reset token has expired. Please request a new password reset.";
            case 404:
              return "Reset token not found. Please request a new password reset.";
            case 429:
              return "Too many attempts. Please try again later.";
            case 500:
              return "Server error. Please try again later.";
            default:
              if (error.code === "NETWORK_ERROR" || !error.response) {
                return "Network error. Please check your connection.";
              }
              return errorData?.message || "Failed to reset password";
          }
        }

        if (error instanceof Error) {
          return error.message;
        }

        return "An unexpected error occurred";
      };

      const errorMessage = getErrorMessage(error);
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
        <div className="auth-header flex justify-center py-6 bg-primary/5">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <img
              src="/family-portal-logo.svg"
              alt="Logo"
              className="w-10 h-10 text-primary"
            />
          </div>
        </div>
        <div className="auth-form px-8 pb-8 pt-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-primary">
              Reset Password
            </h1>
            <p className="text-text-muted">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-base mb-2"
              >
                New Password <span className="text-error">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="input"
                placeholder="Enter your new password"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-base mb-2"
              >
                Confirm New Password <span className="text-error">*</span>
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="input"
                placeholder="Confirm your new password"
              />
            </div>

            <div className="text-xs text-muted mb-6">
              Password must contain at least 8 characters, one uppercase letter,
              one lowercase letter, one number, and one special character.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>

            <div className="text-center mt-6">
              <Link
                to="/login"
                className="font-medium text-primary hover:text-secondary transition-colors text-sm"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
