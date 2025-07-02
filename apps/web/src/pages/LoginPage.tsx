import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    // Basic email regex validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (!validateEmail(email)) {
      setMessage('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
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
          setMessage(data.message || 'Bad Request.');
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
      <form onSubmit={handleSubmit} className="mx-auto max-w-[300px] text-left">
        <div className="mb-[15px] flex items-center">
          <label htmlFor="email" className="mb-[5px] w-[100px] text-right mr-[15px]">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="p-[8px] w-[160px] rounded-[4px] border border-solid border-[#ccc]"
          />
        </div>
        <div className="mb-[15px] flex items-center">
          <label htmlFor="password" className="mb-[5px] w-[100px] text-right mr-[15px]">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="p-[8px] w-[160px] rounded-[4px] border border-solid border-[#ccc]"
          />
        </div>
        <div className="text-right">
          <Button label={loading ? 'Logging In...' : 'Login'} type="submit" disabled={loading} />
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
