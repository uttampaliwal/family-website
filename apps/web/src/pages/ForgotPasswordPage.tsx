import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { isAxiosError } from "axios";
import { useToast } from "../hooks/useToast";
import api from "../services/axios";
import { ensureCsrfToken } from "../utils/csrf";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const { showToast } = useToast();

  const handleForgotPasswordError = (error: unknown) => {
    // Handle error without console logging for production

    if (error instanceof TypeError && error.message.includes("fetch")) {
      showToast(
        "Network error. Please check your internet connection.",
        "error",
      );
    } else if (isAxiosError(error) && error.response) {
      if (error.response.status === 404) {
        showToast(
          "Email address not found. Please check and try again.",
          "error",
        );
      } else if (error.response.status >= 500) {
        showToast("Server error. Please try again later.", "error");
      } else {
        showToast(
          error.response.data?.message || "Failed to send reset email",
          "error",
        );
      }
    } else if (error instanceof Error) {
      showToast(error.message, "error");
    } else {
      showToast("Failed to connect to the server", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Sending password reset email...", "info");

    try {
      // Ensure CSRF token is available before making the request
      await ensureCsrfToken();

      // Add a small delay to ensure CSRF token is properly set
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await api.post("/api/auth/forgot-password", { email });
      const data = response.data;

      showToast(data.message, "success");
    } catch (error) {
      // Log error for debugging in development only
      if (import.meta.env.DEV) {
        console.error("Forgot password error:", error);
      }
      handleForgotPasswordError(error);
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
              Forgot Password
            </h1>
            <p className="text-text-muted">
              Enter your email to reset your password
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-base mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <button type="submit" className="btn btn-primary w-full">
                Send Password Reset Link
              </button>
            </div>
          </form>

          <div className="text-center mt-6">
            <p className="text-muted">
              Remember your password?{" "}
              <Link
                to="/login"
                className="font-medium text-primary hover:text-secondary transition-colors"
              >
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
