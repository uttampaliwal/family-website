import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import Button from '../components/Button';
import CustomSelect from '../components/CustomSelect';

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
      if (password !== confirmPassword) {
        setMessage('Confirm password should be same as password.');
        return;
      }
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        setMessage(`Password must contain: ${passwordErrors.join(', ')}.`);
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
    <div className="text-center mt-[10px]">
      <h1 className="text-[32px] font-bold mb-[20px]">Register</h1>
      <form onSubmit={handleSubmit} className="mx-auto max-w-[300px] text-left">
        {step === 1 && (
          <div className="mb-[25px]">
            <h2 className="mb-[20px]">Account Information</h2>
            <div className="mb-[15px] flex items-center">
              <label htmlFor="username" className="mb-[5px] w-[100px] text-right mr-[15px]">Username:</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                className="p-[8px] w-[180px] rounded-[4px] border border-solid border-[#ccc]"
              />
            </div>
            <div className="mb-[15px] flex items-center">
              <label htmlFor="email" className="mb-[5px] w-[100px] text-right mr-[15px]">Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="p-[8px] w-[180px] rounded-[4px] border border-solid border-[#ccc]"
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
                className="p-[8px] w-[180px] rounded-[4px] border border-solid border-[#ccc]"
              />
            </div>
            <div className="mb-[15px] flex items-center">
              <label htmlFor="confirmPassword" className="mb-[5px] w-[100px] text-right mr-[15px]">Confirm Password:</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="p-[8px] w-[180px] rounded-[4px] border border-solid border-[#ccc]"
              />
            </div>
            <div className="text-right">
              <Button label="Next" onClick={handleNext} disabled={loading} type="button" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mb-[15px]">
            <h2 className="mb-[20px]">Personal Details</h2>
            <div className="mb-[15px] flex items-center">
              <label htmlFor="name" className="mb-[5px] w-[100px] text-right mr-[15px]">Name:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                className="p-[8px] w-[180px] rounded-[4px] border border-solid border-[#ccc]"
              />
            </div>
            <div className="mb-[15px] flex items-center">
              <label htmlFor="dob" className="mb-[5px] w-[100px] text-right mr-[15px]">Date of Birth:</label>
              <input
                type="date"
                id="dob"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                disabled={loading}
                className="p-[8px] w-[180px] rounded-[4px] border border-solid border-[#ccc]"
              />
            </div>
            <div className="mb-[15px] flex items-center">
              <label htmlFor="mobileNumber" className="mb-[5px] w-[100px] text-right mr-[15px]">Mobile Number:</label>
              <input
                type="tel"
                id="mobileNumber"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                disabled={loading}
                className="p-[8px] w-[180px] rounded-[4px] border border-solid border-[#ccc]"
              />
            </div>
            <div className="mb-[15px] flex items-center">
              <label htmlFor="gender" className="mb-[5px] w-[100px] text-right mr-[15px]">Gender:</label>
              <CustomSelect
                options={[
                  { value: '', label: 'Select Gender' },
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Prefer not to say', label: 'Prefer not to say' },
                ]}
                value={gender}
                onChange={setGender}
                placeholder="Select Gender"
                disabled={loading}
                className="w-[180px]"
              />
            </div>
            <div className="text-right">
              <Button label="Previous" onClick={handlePrevious} disabled={loading} className="mr-[10px]" />
              <Button label={loading ? 'Registering...' : 'Register'} type="submit" disabled={loading} />
            </div>
          </div>
        )}
      </form>
      {message && <p className={`mt-[20px] ${message.includes('successful') ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}
      <p className="mt-[20px]">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default RegisterPage;