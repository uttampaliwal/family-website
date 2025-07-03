import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';

const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false); // New state for password visibility
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
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

  return (
    <div className="text-center mt-[10px]">
      <h1 className="text-[32px] font-bold mb-[20px]">Login</h1>
      <form onSubmit={handleSubmit} className="mx-auto max-w-md text-left">
        <div className="mb-8 p-6 bg-gray-800 rounded-lg shadow-lg">
          <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center">
            <label htmlFor="identifier" className="mb-1 sm:mb-0 sm:w-32 text-left sm:text-right mr-4 text-gray-300">Email or Username:</label>
            <input
              type="text"
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              disabled={loading}
              className="flex-1 p-3 rounded-md border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center relative">
            <label htmlFor="password" className="mb-1 sm:mb-0 sm:w-32 text-left sm:text-right mr-4 text-gray-300">Password:</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="flex-1 p-3 rounded-md border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" // Added pr-10 for padding for the button
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
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
      {message && <p className={`mt-[20px] ${message.includes('successful') ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}
      <p className="mt-[20px]">
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default LoginPage;
