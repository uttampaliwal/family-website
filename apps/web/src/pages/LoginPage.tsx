import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';

const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false); // New state for password visibility
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showResendButton, setShowResendButton] = useState<boolean>(false); // New state for resend button visibility
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Login successful!');
        console.log('JWT Token (placeholder):', data.token);
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        if (response.status === 400) {
          if (data.message === 'Invalid credentials') {
            setMessage('Invalid credentials. Please check your details or register.');
          } else if (data.message === 'Please verify your email before logging in.') {
            setMessage(data.message);
            setShowResendButton(true);
          } else {
            setMessage(data.message || 'Bad Request.');
          }
        } else if (response.status === 500) {
          setMessage('Server error. Please try again later.');
        } else {
          setMessage(data.message || 'An unexpected error occurred.');
        }
      }
    } catch (error) {
      console.error('Error during login:', error);
      if (error instanceof TypeError) {
        setMessage('Network error. Please check your internet connection or try again later.');
      } else {
        setMessage('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || 'Verification email sent successfully!');
        setShowResendButton(false);
      } else {
        setMessage(data.message || 'Failed to resend verification email.');
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      setMessage('An error occurred while resending verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative text-center">
      {/* Ribbon for Register Page */}
      <Link to="/register" className="absolute top-[-10px] right-[-10px] bg-blue-500 text-white px-4 py-2 rounded-bl-lg shadow-lg transform rotate-45 translate-x-1/4 -translate-y-1/4 origin-top-right">
        <span className="block transform -rotate-45">Register</span>
      </Link>
      <h1 className="text-4xl font-extrabold mb-6 text-gray-100">Login</h1>
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl text-left">
        <div className="mb-8 p-8 bg-gray-900 rounded-xl shadow-xl">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center">
            <label htmlFor="identifier" className="mb-2 sm:mb-0 sm:w-40 text-left sm:text-right mr-4 text-gray-300">Email or Username:</label>
            <input
              type="text"
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              disabled={loading}
              className="flex-1 p-3 rounded-md border border-gray-700 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center relative">
            <label htmlFor="password" className="mb-2 sm:mb-0 sm:w-40 text-left sm:text-right mr-4 text-gray-300">Password:</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="flex-1 p-3 rounded-md border border-gray-700 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" // Added pr-10 for padding for the button
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none text-sm"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="text-right mt-6">
            <Button label={loading ? 'Logging In...' : 'Login'} type="submit" disabled={loading} />
          </div>
        </div>
      </form>
      {message && <p role="alert" className={`mt-[20px] ${message.includes('successful') ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}
      {showResendButton && (
        <button
          onClick={handleResendVerification}
          disabled={loading}
          className="mt-4 text-blue-500 hover:underline"
        >
          Resend Verification Email
        </button>
      )}
      <p className="mt-[20px]">
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default LoginPage;
    
