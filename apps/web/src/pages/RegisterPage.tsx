import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import Button from '../components/Button';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1); // New state for multi-step form

  const validateEmail = (email: string) => {
    // Basic email regex validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    // Password must be at least 8 characters long
    // Contain at least one uppercase letter
    // Contain at least one lowercase letter
    // Contain at least one number
    // Contain at least one special character
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('at least one number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('at least one special character');
    }
    return errors;
  };

  const handleNext = () => {
    setMessage('');
    if (step === 1) {
      // Validate Step 1 fields
      if (!username || !email || !password || !confirmPassword) {
        setMessage('Please fill in all required fields for Account Information.');
        return;
      }
      if (!validateEmail(email)) {
        setMessage('Please enter a valid email address.');
        return;
      }
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        setMessage(`Password must contain: ${passwordErrors.join(', ')}.`);
        return;
      }
      if (password !== confirmPassword) {
        setMessage('Passwords do not match.');
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setMessage('');
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    // Validate Step 2 fields before final submission
    if (step === 2) {
      if (!name || !dob || !gender) {
        setMessage('Please fill in all required fields for Personal Details.');
        setLoading(false);
        return;
      }
    }

    setMessage('Attempting to register...');

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, dob, mobileNumber, username, gender }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Registration successful! Please check your email for verification.');
      } else {
        setMessage(data.message || 'Registration failed.');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Register</h1>
      <form onSubmit={handleSubmit} style={{ margin: '0 auto', maxWidth: '300px', textAlign: 'left' }}>
        {step === 1 && (
          <div style={{ marginBottom: '25px' }}>
            <h2 style={{ marginBottom: '20px' }}>Account Information</h2>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="username" style={{ display: 'inline-block', marginBottom: '5px', width: '100px', textAlign: 'right', marginRight: '15px', verticalAlign: 'middle' }}>Username:</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                style={{ padding: '8px', width: '180px', borderRadius: '4px', border: '1px solid #ccc', verticalAlign: 'middle' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="email" style={{ display: 'inline-block', marginBottom: '5px', width: '80px', textAlign: 'right', marginRight: '10px', verticalAlign: 'middle' }}>Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                style={{ padding: '8px', width: '160px', borderRadius: '4px', border: '1px solid #ccc', verticalAlign: 'middle' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="password" style={{ display: 'inline-block', marginBottom: '5px', width: '80px', textAlign: 'right', marginRight: '10px', verticalAlign: 'middle' }}>Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{ padding: '8px', width: '160px', borderRadius: '4px', border: '1px solid #ccc', verticalAlign: 'middle' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="confirmPassword" style={{ display: 'inline-block', marginBottom: '5px', width: '100px', textAlign: 'right', marginRight: '15px', verticalAlign: 'middle' }}>Confirm Password:</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                style={{ padding: '8px', width: '180px', borderRadius: '4px', border: '1px solid #ccc', verticalAlign: 'middle' }}
              />
            </div>
            <Button label="Next" onClick={handleNext} disabled={loading} />
          </div>
        )}

        {step === 2 && (
          <div style={{ marginBottom: '15px' }}>
            <h2 style={{ marginBottom: '20px' }}>Personal Details</h2>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="name" style={{ display: 'inline-block', marginBottom: '5px', width: '80px', textAlign: 'right', marginRight: '10px', verticalAlign: 'middle' }}>Name:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                style={{ padding: '8px', width: '160px', borderRadius: '4px', border: '1px solid #ccc', verticalAlign: 'middle' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="dob" style={{ display: 'inline-block', marginBottom: '5px', width: '80px', textAlign: 'right', marginRight: '10px', verticalAlign: 'middle' }}>Date of Birth:</label>
              <input
                type="date"
                id="dob"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                disabled={loading}
                style={{ padding: '8px', width: '160px', borderRadius: '4px', border: '1px solid #ccc', verticalAlign: 'middle' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="mobileNumber" style={{ display: 'inline-block', marginBottom: '5px', width: '80px', textAlign: 'right', marginRight: '10px', verticalAlign: 'middle' }}>Mobile Number:</label>
              <input
                type="tel"
                id="mobileNumber"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                disabled={loading}
                style={{ padding: '8px', width: '160px', borderRadius: '4px', border: '1px solid #ccc', verticalAlign: 'middle' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="gender" style={{ display: 'inline-block', marginBottom: '5px', width: '80px', textAlign: 'right', marginRight: '10px', verticalAlign: 'middle' }}>Gender:</label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
                disabled={loading}
                style={{ padding: '8px', width: '160px', borderRadius: '4px', border: '1px solid #ccc', verticalAlign: 'middle' }}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <Button label="Previous" onClick={handlePrevious} disabled={loading} style={{ marginRight: '10px' }} />
            <Button label={loading ? 'Registering...' : 'Register'} type="submit" disabled={loading} />
          </div>
        )}
      </form>
      {message && <p style={{ marginTop: '20px', color: message.includes('successful') ? 'green' : 'red' }}>{message}</p>}
      <p style={{ marginTop: '20px' }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default RegisterPage;