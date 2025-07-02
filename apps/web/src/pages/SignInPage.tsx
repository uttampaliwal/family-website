import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';

const SignInPage: React.FC = () => {
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
      const response = await fetch('http://localhost:3001/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Sign in successful!');
        // In a real app, you'd store the JWT token (e.g., in localStorage or HttpOnly cookie)
        // and then redirect.
        console.log('JWT Token (placeholder):', data.token);
        setTimeout(() => {
          navigate('/'); // Redirect to home page after successful sign-in
        }, 1500); // Give user time to read success message
      } else {
        if (data.message === 'User not found') {
          setMessage('User not registered. Redirecting to sign up...');
          setTimeout(() => {
            navigate('/signup');
          }, 2000); // Redirect after 2 seconds
        } else {
          setMessage(data.message || 'Sign in failed.');
        }
      }
    } catch (error) {
      console.error('Error during sign-in:', error);
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Sign In</h1>
      <form onSubmit={handleSubmit} style={{ margin: '0 auto', maxWidth: '300px', textAlign: 'left' }}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            style={{ padding: '8px', width: '250px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={{ padding: '8px', width: '250px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <Button label={loading ? 'Signing In...' : 'Sign In'} type="submit" disabled={loading} />
      </form>
      {message && <p style={{ marginTop: '20px', color: message.includes('successful') ? 'green' : 'red' }}>{message}</p>}
      <p style={{ marginTop: '20px' }}>
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
};

export default SignInPage;
