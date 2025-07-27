import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../api/axios';
import type { LoginRequest, AuthResponse, ResendVerificationRequest } from '../types/api';
import { isAxiosError } from 'axios';

const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [showResendButton, setShowResendButton] = useState<boolean>(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showToast('', 'info'); // Clear previous messages
    setLoading(true);

    try {
      const response = await api.post<AuthResponse>('/api/auth/login', {
        identifier,
        password,
      } as LoginRequest);

      const data = response.data;
      if (response.status === 200) {
        localStorage.setItem('accessToken', data.accessToken || '');
        login(data.username || '');
        showToast(data.message || 'Login successful!', 'success');
        navigate(`/profile/${data.username}`);
      }
    } catch (error) {
      // Structured error logging with context
      const errorInfo = {
        message: error instanceof Error ? error.message : 'Unknown error',
        identifier: identifier,
        timestamp: new Date().toISOString(),
        operation: 'userLogin'
      };
      console.error('Error during login:', JSON.stringify(errorInfo));

      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (isAxiosError(error)) {
        if (error.response) {
          if (error.response.status === 400 || error.response.status === 401) {
            if (typeof error.response.data === 'string') {
              errorMessage = error.response.data;
            } else {
              errorMessage = error.response.data?.message || 'Invalid credentials';
            }
            if (error.response.data?.message === 'Please verify your email before logging in.') {
              setShowResendButton(true);
            }
          } else if (error.response.status >= 500) {
            errorMessage = 'Server error. Please try again later.';
          } else {
            errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
          }
        } else if (error.request) {
          errorMessage = 'Network error. Please check your internet connection or try again later.';
        } else {
          errorMessage = error.message || errorMessage;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    showToast('', 'info'); // Clear previous messages
    try {
      const response = await api.post<AuthResponse>(`${import.meta.env.VITE_API_BASE_URL}/api/auth/resend-verification`, {
        identifier,
      } as ResendVerificationRequest);
      const data = response.data;
      if (response.status === 200) {
        showToast(data.message || 'Verification email sent successfully!', 'success');
        setShowResendButton(false);
      } else {
        showToast(data.message || 'Failed to resend verification email.', 'error');
      }
    } catch (error) {
      // Structured error logging with context
      const errorInfo = {
        message: error instanceof Error ? error.message : 'Unknown error',
        identifier: identifier,
        timestamp: new Date().toISOString(),
        operation: 'resendVerification'
      };
      console.error('Error resending verification email:', JSON.stringify(errorInfo));
      
      let errorMessage = 'An error occurred while resending verification email.';
      
      if (isAxiosError(error)) {
        if (error.response) {
          if (error.response.status === 404) {
            errorMessage = 'User not found. Please check your email or username.';
          } else if (error.response.status >= 500) {
            errorMessage = 'Server error. Please try again later.';
          } else if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          }
        } else if (error.request) {
          errorMessage = 'Network error. Please check your connection.';
        }
      }
      
      showToast(errorMessage, 'error');
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
          <h1 className="font-cursive text-4xl md:text-5xl font-bold mb-2 gradient-text">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400">Sign in to continue to your account</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="h-2 gradient-bg"></div>
          <form onSubmit={handleSubmit} className="p-8">
            <div className="mb-6">
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email or Username
              </label>
              <input
                type="text"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={loading}
                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email or username"
              />
            </div>
            
            <div className="mb-6 relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 pr-10"
                placeholder="Enter your password"
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
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Remember me
                </label>
              </div>
              
              <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                Forgot password?
              </Link>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-bg text-white py-3 px-4 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md hover:opacity-90 transition-all duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          {showResendButton && (
            <div className="px-8 pb-6 -mt-2">
              <button
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full text-center text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                Resend Verification Email
              </button>
            </div>
          )}
        </div>
        
        <div className="text-center mt-6">
          <p className="text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
              Sign up now
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
