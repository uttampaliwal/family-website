import React, { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';

import Button from '../components/Button';
import CustomSelect from '../components/CustomSelect';
import DateOfBirthPicker from '../components/DateOfBirthPicker';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [dob, setDob] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1); // New state for multi-step form

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const validateEmail = useCallback((email: string) => {
    // Basic email regex validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

  const validatePassword = useCallback((password: string) => {
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
  }, []);

  const handleNext = useCallback(() => {
    setMessage('');
    if (step === 1) {
      // Validate Step 1 fields (Personal Details)
      if (!name || !dob || !gender) {
        setMessage('Please fill in all required fields for Personal Details.');
        if (!name) nameRef.current?.focus();
        return;
      }
    } else if (step === 2) {
      // Validate Step 2 fields (Account Information)
      if (!email || !username || !password || !confirmPassword) {
        setMessage('Please fill in all required fields for Account Information.');
        if (!email) emailRef.current?.focus();
        else if (!username) usernameRef.current?.focus();
        else if (!password) passwordRef.current?.focus();
        else if (!confirmPassword) confirmPasswordRef.current?.focus();
        return;
      }
      if (!validateEmail(email)) {
        setMessage('Please enter a valid email address.');
        emailRef.current?.focus();
        return;
      }
      if (password !== confirmPassword) {
        setMessage('Confirm password should be same as password.');
        confirmPasswordRef.current?.focus();
        return;
      }
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        setMessage(`Password must contain: ${passwordErrors.join(', ')}.`);
        passwordRef.current?.focus();
        return;
      }
    }
    setStep(step + 1);
  }, [step, name, dob, gender, email, username, password, confirmPassword, validateEmail, validatePassword]);

  const handlePrevious = useCallback(() => {
    setMessage('');
    setStep(step - 1);
  }, [step]);

  const retryFetch = useCallback(async (url: RequestInfo | URL, options?: RequestInit, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok || response.status < 500) {
          return response;
        }
      } catch (error) {
        if (i < retries - 1) {
          console.warn(`Fetch failed, retrying in ${delay}ms...`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error; // Re-throw error if max retries reached
        }
      }
    }
    throw new Error('Max retries reached');
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    // Validate Step 2 fields (Account Information) before final submission
    if (step === 2) {
      // Priority 1: Check for password mismatch first.
      if (password !== confirmPassword) {
        setMessage('Passwords do not match.');
        confirmPasswordRef.current?.focus();
        setLoading(false);
        return;
      }

      // Priority 2: Check if all fields are filled.
      if (!email || !username || !password || !confirmPassword) {
        setMessage('Please fill in all required fields for Account Information.');
        if (!email) emailRef.current?.focus();
        else if (!username) usernameRef.current?.focus();
        else if (!password) passwordRef.current?.focus();
        else if (!confirmPassword) confirmPasswordRef.current?.focus();
        setLoading(false);
        return;
      }

      // Priority 3: Validate email format.
      if (!validateEmail(email)) {
        setMessage('Please enter a valid email address.');
        emailRef.current?.focus();
        setLoading(false);
        return;
      }
      
      // Priority 4: Validate password strength.
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        setMessage(`Password must contain: ${passwordErrors.join(', ')}.`);
        passwordRef.current?.focus();
        setLoading(false);
        return;
      }
    }

    setMessage('Attempting to register...');

    try {
      const response = await retryFetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register`, {
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
        if (response.status === 400) {
          setMessage(data.message || 'Bad Request.');
        } else if (response.status === 500) {
          setMessage('Server error. Please try again later.');
        } else {
          setMessage(data.message || 'An unexpected error occurred.');
        }
      }
    } catch (error) {
      console.error('Error during registration:', error);
      if (error instanceof TypeError) {
        setMessage('Network error. Please check your internet connection or try again later.');
      } else {
        setMessage('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [name, email, password, dob, mobileNumber, username, gender, step, validateEmail, validatePassword]);

  return (
    <div className="text-center mt-[10px]">
      <h1 className="text-[32px] font-bold mb-[20px]">Register</h1>
      <form onSubmit={handleSubmit} className="mx-auto max-w-lg text-left">
        {step === 1 && (
          <div className="mb-8 p-6 bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-2xl font-extrabold mb-6 text-white">Personal Details</h2>
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center">
              <label htmlFor="name" className="mb-1 sm:mb-0 sm:w-32 text-left sm:text-right mr-4 text-gray-300">Name:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-required="true"
                disabled={loading}
                ref={nameRef}
                className="flex-1 p-3 rounded-md border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center">
              <label htmlFor="dob" className="mb-1 sm:mb-0 sm:w-32 text-left sm:text-right mr-4 text-gray-300">DOB:</label>
              <DateOfBirthPicker
                value={dob}
                onChange={setDob}
                disabled={loading}
              />
            </div>
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center">
              <label htmlFor="mobileNumber" className="mb-1 sm:mb-0 sm:w-32 text-left sm:text-right mr-4 text-gray-300">Mobile Number:</label>
              <input
                type="tel"
                id="mobileNumber"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                disabled={loading}
                className="flex-1 p-3 rounded-md border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center">
              <label htmlFor="gender" className="mb-1 sm:mb-0 sm:w-32 text-left sm:text-right mr-4 text-gray-300">Gender:</label>
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
                className="flex-1"
              />
            </div>
            <div className="text-right mt-6">
              <Button label="Next" onClick={handleNext} disabled={loading} type="button" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mb-8 p-6 bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-2xl font-extrabold mb-6 text-white">Account Information</h2>
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center">
              <label htmlFor="email" className="mb-1 sm:mb-0 sm:w-32 text-left sm:text-right mr-4 text-gray-300">Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-required="true"
                disabled={loading}
                ref={emailRef}
                className="flex-1 p-3 rounded-md border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center">
              <label htmlFor="username" className="mb-1 sm:mb-0 sm:w-32 text-left sm:text-right mr-4 text-gray-300">Username:</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                aria-required="true"
                disabled={loading}
                ref={usernameRef}
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
                aria-required="true"
                disabled={loading}
                ref={passwordRef}
                className="flex-1 p-3 rounded-md border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
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
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center relative">
              <label htmlFor="confirmPassword" className="mb-1 sm:mb-0 sm:w-32 text-left sm:text-right mr-4 text-gray-300">Confirm Password:</label>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                aria-required="true"
                disabled={loading}
                ref={confirmPasswordRef}
                className="flex-1 p-3 rounded-md border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="text-right mt-6">
              <Button label="Previous" onClick={handlePrevious} disabled={loading} className="mr-4" />
              <Button label={loading ? 'Registering...' : 'Register'} type="submit" disabled={loading} />
            </div>
          </div>
        )}
      </form>
      {message && <p role="alert" className={`mt-[20px] ${message.includes('successful') ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}
      <p className="mt-[20px]">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
