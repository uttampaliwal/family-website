import React, { useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/axios";
import { useFormValidation } from "../hooks/useFormValidation";
import type { RegisterRequest, AuthResponse } from "../types/api";
import { isAxiosError } from "axios";
import { useToast } from "../hooks/useToast";
import { ensureCsrfToken } from "../utils/csrf";
import { GENDER_OPTIONS, normalizeGender } from "../lib/gender";

const RegisterPage: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [dob, setDob] = useState<string>("");
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [relationship, setRelationship] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);

  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const usernameRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const confirmPasswordRef = useRef<HTMLInputElement | null>(null);

  const { validateEmail, validatePassword } = useFormValidation();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const validateStep2 = useCallback(() => {
    if (!email || !username || !password || !confirmPassword) {
      showToast(
        "Please fill in all required fields for Account Information.",
        "error",
      );
      if (!email) emailRef.current?.focus();
      else if (!username) usernameRef.current?.focus();
      else if (!password) passwordRef.current?.focus();
      else if (!confirmPassword) confirmPasswordRef.current?.focus();
      return false;
    }
    if (password !== confirmPassword) {
      showToast("Confirm password should be same as password.", "error");
      confirmPasswordRef.current?.focus();
      return false;
    }
    if (!validateEmail(email)) {
      showToast("Please enter a valid email address.", "error");
      emailRef.current?.focus();
      return false;
    }
    const passwordValidationResult = validatePassword(password);
    if (
      passwordValidationResult.errors &&
      passwordValidationResult.errors.length > 0
    ) {
      showToast(
        `Password must contain: ${passwordValidationResult.errors.join(", ")}`,
        "error",
      );
      passwordRef.current?.focus();
      return false;
    }
    return true;
  }, [
    email,
    username,
    password,
    confirmPassword,
    validateEmail,
    validatePassword,
    showToast,
  ]);

  const handleNext = useCallback(() => {
    showToast("", "info"); // Clear previous messages
    if (step === 1) {
      if (!name || !dob || !gender || !relationship) {
        showToast(
          "Please fill in all required fields for Personal Details.",
          "error",
        );
        if (!name) nameRef.current?.focus();
        return;
      }
    } else if (step === 2) {
      if (!validateStep2()) return;
    }
    setStep(step + 1);
  }, [step, name, dob, gender, relationship, validateStep2, showToast]);

  const handlePrevious = useCallback(() => {
    showToast("", "info"); // Clear previous messages
    setStep(step - 1);
  }, [step, showToast]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      showToast("", "info"); // Clear previous messages
      setLoading(true);

      if (step === 2) {
        if (password !== confirmPassword) {
          showToast("Passwords do not match.", "error");
          confirmPasswordRef.current?.focus();
          setLoading(false);
          return;
        }

        if (!email || !username || !password || !confirmPassword) {
          showToast(
            "Please fill in all required fields for Account Information.",
            "error",
          );
          if (!email) emailRef.current?.focus();
          else if (!username) usernameRef.current?.focus();
          else if (!password) passwordRef.current?.focus();
          else if (!confirmPassword) confirmPasswordRef.current?.focus();
          setLoading(false);
          return;
        }

        if (!validateEmail(email)) {
          showToast("Please enter a valid email address.", "error");
          emailRef.current?.focus();
          setLoading(false);
          return;
        }

        const passwordErrors = validatePassword(password);
        if (passwordErrors.errors && passwordErrors.errors.length > 0) {
          showToast(
            `Password must contain: ${passwordErrors.errors.join(", ")}.`,
            "error",
          );
          passwordRef.current?.focus();
          setLoading(false);
          return;
        }
      }

      showToast("Attempting to register...", "info");

      try {
        // Ensure CSRF token is available before making the request
        await ensureCsrfToken();

        const response = await api.post<AuthResponse>(
          `${import.meta.env.VITE_API_BASE_URL || ""}/api/auth/register`,
          {
            name: name,
            email: email,
            password: password,
            dob: dob,
            mobileNumber: mobileNumber,
            username: username,
            gender: normalizeGender(gender),
            relationship: relationship,
          } as RegisterRequest,
        );

        const data = response.data;

        if (response.status === 201) {
          showToast(
            data.message ||
              "Registration successful! Please check your email for verification.",
            "success",
          );
          setTimeout(() => {
            navigate("/login");
          }, 3000); // Navigate after 3 seconds to allow user to read the toast
        } else {
          showToast(data.message || "An unexpected error occurred.", "error");
        }
      } catch (error) {
        if (isAxiosError(error)) {
          if (error.response) {
            if (error.response.status === 400 && error.response.data?.message) {
              showToast(error.response.data.message, "error");
            } else if (error.response.status === 409) {
              showToast(
                "User already exists. Please try with different email or username.",
                "error",
              );
            } else if (error.response.status >= 500) {
              showToast("Server error. Please try again later.", "error");
            } else {
              showToast(
                "Registration failed. Please check your information.",
                "error",
              );
            }
          } else if (error.code === "NETWORK_ERROR") {
            showToast("Network error. Please check your connection.", "error");
          } else {
            showToast("Registration failed. Please try again.", "error");
          }
        } else {
          showToast("An unexpected error occurred. Please try again.", "error");
        }
      } finally {
        setLoading(false);
      }
    },
    [
      name,
      email,
      password,
      confirmPassword,
      dob,
      mobileNumber,
      username,
      gender,
      relationship,
      step,
      validateEmail,
      validatePassword,
      showToast,
      navigate,
    ],
  );

  return (
    <div className="auth-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="auth-card"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 gradient-text">
            Create Account
          </h1>
          <p className="text-muted">Join our family portal today</p>
        </div>

        <div className="auth-form">
          <div className="auth-header"></div>

          {/* Progress indicator */}
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? "bg-primary text-on-primary" : "bg-surface text-muted"}`}
                >
                  1
                </div>
                <span
                  className={`ml-2 text-sm ${step === 1 ? "text-base font-medium" : "text-muted"}`}
                >
                  Personal Details
                </span>
              </div>
              <div className="flex-1 mx-4 h-1 bg-border"></div>
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? "bg-primary text-on-primary" : "bg-surface text-muted"}`}
                >
                  2
                </div>
                <span
                  className={`ml-2 text-sm ${step === 2 ? "text-base font-medium" : "text-muted"}`}
                >
                  Account Info
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 pt-2">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-base mb-2"
                  >
                    Full Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                    ref={nameRef}
                    className="input"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="dob"
                    className="block text-sm font-medium text-base mb-2"
                  >
                    Date of Birth <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    id="dob"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                    disabled={loading}
                    className="input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="mobileNumber"
                    className="block text-sm font-medium text-base mb-2"
                  >
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    id="mobileNumber"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    disabled={loading}
                    className="input"
                    placeholder="Enter your mobile number"
                  />
                </div>

                <div>
                  <label
                    htmlFor="gender"
                    className="block text-sm font-medium text-base mb-2"
                  >
                    Gender <span className="text-error">*</span>
                  </label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    disabled={loading}
                    className="input"
                  >
                    {GENDER_OPTIONS(true).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="relationship"
                    className="block text-sm font-medium text-base mb-2"
                  >
                    What is your relationship with Uttam Paliwal (S/O Ravi
                    Paliwal)? <span className="text-error">*</span>
                  </label>
                  <select
                    id="relationship"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    required
                    disabled={loading}
                    className="input"
                  >
                    <option value="">Select relationship</option>
                    <option value="self">Self</option>
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="son">Son</option>
                    <option value="daughter">Daughter</option>
                    <option value="brother">Brother</option>
                    <option value="sister">Sister</option>
                    <option value="husband">Husband</option>
                    <option value="wife">Wife</option>
                    <option value="grandfather">Grandfather</option>
                    <option value="grandmother">Grandmother</option>
                    <option value="uncle">Uncle</option>
                    <option value="aunt">Aunt</option>
                    <option value="cousin">Cousin</option>
                    <option value="nephew">Nephew</option>
                    <option value="niece">Niece</option>
                    <option value="son-in-law">Son-in-law</option>
                    <option value="daughter-in-law">Daughter-in-law</option>
                    <option value="brother-in-law">Brother-in-law</option>
                    <option value="sister-in-law">Sister-in-law</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={loading}
                    className="btn btn-primary w-full"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-base mb-2"
                  >
                    Email <span className="text-error">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    ref={emailRef}
                    className="input"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-base mb-2"
                  >
                    Username <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    ref={usernameRef}
                    className="input"
                    placeholder="Choose a username"
                  />
                </div>

                <div className="relative">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-base mb-2"
                  >
                    Password <span className="text-error">*</span>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    ref={passwordRef}
                    className="input pr-10"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-muted hover:text-base focus:outline-none"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
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

                <div className="relative">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-base mb-2"
                  >
                    Confirm Password <span className="text-error">*</span>
                  </label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    ref={confirmPasswordRef}
                    className="input pr-10"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-[38px] text-muted hover:text-base focus:outline-none"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
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

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Password must contain at least 8 characters, one uppercase
                  letter, one lowercase letter, one number, and one special
                  character.
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={loading}
                    className="btn btn-secondary w-1/2"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-1/2"
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
                        Registering...
                      </>
                    ) : (
                      "Register"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-muted">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-secondary transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
