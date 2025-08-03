import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useToast } from '../hooks/useToast';
import api from '../api/axios'; // Import the configured axios instance


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
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-900">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Forgot Password</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Send Password Reset Link
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
