import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { isAxiosError } from "axios";
import { useToast } from "../hooks/useToast";
import { resetPassword as resetPasswordApi } from "../api/auth";

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
    showToast("", "info");
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
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="font-cursive text-4xl md:text-5xl font-bold mb-2 gradient-text">
            Reset Password
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your new password below
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="h-2 gradient-bg"></div>
          <form className="p-8" onSubmit={handleSubmit}>
            <div className="mb-6 relative">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
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
                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your new password"
              />
            </div>

            <div className="mb-6 relative">
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
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
                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                placeholder="Confirm your new password"
              />
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Password must contain at least 8 characters, one uppercase letter,
              one lowercase letter, one number, and one special character.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-bg text-white py-3 px-4 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md hover:opacity-90 transition-all duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </button>

            <div className="text-center mt-6">
              <Link
                to="/login"
                className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
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
