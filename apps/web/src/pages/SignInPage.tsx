import React, { useState } from 'react';
import Button from '../components/Button';

const SignInPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Attempting to sign in...');

    try {
      // Replace with your actual backend API endpoint for sign-in
      const response = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Sign in successful!');
        // Here you would typically store the JWT token (e.g., in localStorage or HttpOnly cookie)
        // and redirect the user to a dashboard or home page.
        console.log('JWT Token (placeholder):', data.token);
      } else {
        setMessage(data.message || 'Sign in failed.');
      }
    } catch (error) {
      console.error('Error during sign-in:', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Sign In</h1>
      <form onSubmit={handleSubmit} style={{ display: 'inline-block', textAlign: 'left' }}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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
            style={{ padding: '8px', width: '250px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <Button label="Sign In" type="submit" />
      </form>
      {message && <p style={{ marginTop: '20px', color: message.includes('successful') ? 'green' : 'red' }}>{message}</p>}
    </div>
  );
};

export default SignInPage;
