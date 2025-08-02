import React, { useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { useFormValidation } from '../hooks/useFormValidation';
import type { RegisterRequest, AuthResponse } from '../types/api';
import { isAxiosError } from 'axios';
import { useToast } from '../hooks/useToast';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [dob, setDob] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [gender, setGender] = useState<string>('');
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
      showToast('Please fill in all required fields for Account Information.', 'error');
      if (!email) emailRef.current?.focus();
      else if (!username) usernameRef.current?.focus();
      else if (!password) passwordRef.current?.focus();
      else if (!confirmPassword) confirmPasswordRef.current?.focus();
      return false;
    }
    if (password !== confirmPassword) {
      showToast('Confirm password should be same as password.', 'error');
      confirmPasswordRef.current?.focus();
      return false;
    }
    if (!validateEmail(email)) {
      showToast('Please enter a valid email address.', 'error');
      emailRef.current?.focus();
      return false;
    }
    const passwordValidationResult = validatePassword(password);
    if (passwordValidationResult.errors && passwordValidationResult.errors.length > 0) {
      showToast(`Password must contain: ${passwordValidationResult.errors.join(', ')}`, 'error');
      passwordRef.current?.focus();
      return false;
    }
    return true;
  }, [email, username, password, confirmPassword, validateEmail, validatePassword, showToast]);

  const handleNext = useCallback(() => {
    showToast('', 'info'); // Clear previous messages
    if (step === 1) {
      if (!name || !dob || !gender) {
        showToast('Please fill in all required fields for Personal Details.', 'error');
        if (!name) nameRef.current?.focus();
        return;
      }
    } else if (step === 2) {
      if (!validateStep2()) return;
    }
    setStep(step + 1);
  }, [step, name, dob, gender, email, username, password, confirmPassword, validatePassword, showToast]);

  const handlePrevious = useCallback(() => {
    showToast('', 'info'); // Clear previous messages
    setStep(step - 1);
  }, [step, showToast]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    showToast('', 'info'); // Clear previous messages
    setLoading(true);

    if (step === 2) {
      if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        confirmPasswordRef.current?.focus();
        setLoading(false);
        return;
      }

      if (!email || !username || !password || !confirmPassword) {
        showToast('Please fill in all required fields for Account Information.', 'error');
        if (!email) emailRef.current?.focus();
        else if (!username) usernameRef.current?.focus();
        else if (!password) passwordRef.current?.focus();
        else if (!confirmPassword) confirmPasswordRef.current?.focus();
        setLoading(false);
        return;
      }

      if (!validateEmail(email)) {
        showToast('Please enter a valid email address.', 'error');
        emailRef.current?.focus();
        setLoading(false);
        return;
      }
      
      const passwordErrors = validatePassword(password);
      if (passwordErrors.errors && passwordErrors.errors.length > 0) {
        showToast(`Password must contain: ${passwordErrors.errors.join(', ')}.`, 'error');
        passwordRef.current?.focus();
        setLoading(false);
        return;
      }
    }

    showToast('Attempting to register...', 'info');

    try {
      const response = await api.post<AuthResponse>(`${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/register`, {
        name: name, email: email, password: password, dob: dob, mobileNumber: mobileNumber, username: username, gender: gender
      } as RegisterRequest);

      const data = response.data;

      if (response.status === 201) {
        showToast(data.message || 'Registration successful! Please check your email for verification.', 'success');
        setTimeout(() => {
          navigate('/login');
        }, 3000); // Navigate after 3 seconds to allow user to read the toast
      } else {
        showToast(data.message || 'An unexpected error occurred.', 'error');
      }
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response) {
          if (error.response.status === 400 && error.response.data?.message) {
            showToast(error.response.data.message, 'error');
          } else if (error.response.status === 409) {
            showToast('User already exists. Please try with different email or username.', 'error');
          } else if (error.response.status >= 500) {
            showToast('Server error. Please try again later.', 'error');
          } else {
            showToast('Registration failed. Please check your information.', 'error');
          }
        } else if (error.code === 'NETWORK_ERROR') {
          showToast('Network error. Please check your connection.', 'error');
        } else {
          showToast('Registration failed. Please try again.', 'error');
        }
      } else {
        showToast('An unexpected error occurred. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [name, email, password, confirmPassword, dob, mobileNumber, username, gender, step, validateEmail, validatePassword, showToast]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="font-cursive text-4xl md:text-5xl font-bold mb-2 gradient-text">Create Account</h1>
          <p className="text-gray-600 dark:text-gray-400">Join our family portal today</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="h-2 gradient-bg"></div>
          
          {/* Progress indicator */}
          <div className="px-8 pt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? 'gradient-bg text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                  1
                </div>
                <span className={`ml-2 text-sm ${step === 1 ? 'text-gray-800 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>Personal Details</span>
              </div>
              <div className="flex-1 mx-4 h-1 bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? 'gradient-bg text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                  2
                </div>
                <span className={`ml-2 text-sm ${step === 2 ? 'text-gray-800 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>Account Info</span>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 pt-2">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                    ref={nameRef}
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label htmlFor="dob" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="dob"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    id="mobileNumber"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    disabled={loading}
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your mobile number"
                  />
                </div>
                
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Prefer not to say</option>
                  </select>
                </div>
                
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={loading}
                    className="w-full gradient-bg text-white py-3 px-4 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md hover:opacity-90 transition-all duration-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    ref={emailRef}
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    ref={usernameRef}
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="Choose a username"
                  />
                </div>
                
                <div className="relative">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    ref={passwordRef}
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 pr-10"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
                
                <div className="relative">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    ref={confirmPasswordRef}
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 pr-10"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-[38px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={loading}
                    className="w-1/2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-1/2 gradient-bg text-white py-3 px-4 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md hover:opacity-90 transition-all duration-200 flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Registering...
                      </>
                    ) : (
                      'Register'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
