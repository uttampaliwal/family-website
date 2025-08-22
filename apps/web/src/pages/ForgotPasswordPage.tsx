import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { isAxiosError } from 'axios';
import { useToast } from '../hooks/useToast';
import api from '../api/axios';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const { showToast } = useToast();

  const handleForgotPasswordError = (error: unknown, email: string) => {
    console.error('Forgot password error:', JSON.stringify({
      message: error instanceof Error ? error.message : 'Unknown error',
      email: email,
      timestamp: new Date().toISOString(),
      operation: 'forgotPassword'
    }));
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      showToast('Network error. Please check your internet connection.', 'error');
    } else if (isAxiosError(error) && error.response) {
      if (error.response.status === 404) {
        showToast('Email address not found. Please check and try again.', 'error');
      } else if (error.response.status >= 500) {
        showToast('Server error. Please try again later.', 'error');
      } else {
        showToast(error.response.data?.message || 'Failed to send reset email', 'error');
      }
    } else if (error instanceof Error) {
      showToast(error.message, 'error');
    } else {
      showToast('Failed to connect to the server', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showToast('', 'info');

    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      const data = response.data;

      showToast(data.message, 'success');
    } catch (error) {
      handleForgotPasswordError(error, email);
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
          <h1 className="font-cursive text-4xl md:text-5xl font-bold mb-2 gradient-text">Forgot Password</h1>
          <p className="text-gray-600 dark:text-gray-400">Enter your email to reset your password</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="h-2 gradient-bg"></div>
          <form onSubmit={handleSubmit} className="p-8">
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full gradient-bg text-white py-3 px-4 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md hover:opacity-90 transition-all duration-200"
              >
                Send Password Reset Link
              </button>
            </div>
          </form>
        </div>
        <div className="text-center mt-6">
          <p className="text-gray-600 dark:text-gray-400">
            Remember your password?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
              Back to Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
