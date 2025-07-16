import React, { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';

import api from '../api/axios';
import { useFormValidation } from '../hooks/useFormValidation';
import PersonalDetailsForm from '../components/PersonalDetailsForm';
import AccountInformationForm from '../components/AccountInformationForm';
import type { RegisterRequest, AuthResponse } from '../types/api';
import { isAxiosError } from 'axios';

import { useToast } from '../context/ToastContext';

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
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1); // New state for multi-step form

  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const usernameRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const confirmPasswordRef = useRef<HTMLInputElement | null>(null);

  const { validateEmail, validatePassword } = useFormValidation();
  const { showToast } = useToast();

  const handleNext = useCallback(() => {
    showToast('', 'info'); // Clear previous messages
    if (step === 1) {
      if (!name || !dob || !gender) {
        showToast('Please fill in all required fields for Personal Details.', 'error');
        if (!name) nameRef.current?.focus();
        return;
      }
    } else if (step === 2) {
      if (!email || !username || !password || !confirmPassword) {
        showToast('Please fill in all required fields for Account Information.', 'error');
        if (!email) emailRef.current?.focus();
        else if (!username) usernameRef.current?.focus();
        else if (!password) passwordRef.current?.focus();
        else if (!confirmPassword) confirmPasswordRef.current?.focus();
        return;
      }
      if (password !== confirmPassword) {
        showToast('Confirm password should be same as password.', 'error');
        confirmPasswordRef.current?.focus();
        return;
      }
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        showToast(`Password must contain: ${passwordErrors.join(', ')}.`, 'error');
        passwordRef.current?.focus();
        return;
      }
    }
    setStep(step + 1);
  }, [step, name, dob, gender, email, username, password, confirmPassword, validatePassword, showToast]);

  const handlePrevious = useCallback(() => {
    showToast('', 'info'); // Clear previous messages
    setStep(step - 1);
  }, [step, showToast]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    showToast('', 'info'); // Clear previous messages
    setLoading(true);

    if (step === 2) {
      if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        confirmPasswordRef.current?.focus();
        setLoading(false);
        return;
      }

      if (!email || !username || !password || !confirmPassword) {
        showToast('Please fill in all required fields for Account Information.', 'error');
        if (!email) emailRef.current?.focus();
        else if (!username) usernameRef.current?.focus();
        else if (!password) passwordRef.current?.focus();
        else if (!confirmPassword) confirmPasswordRef.current?.focus();
        setLoading(false);
        return;
      }

      if (!validateEmail(email)) {
        showToast('Please enter a valid email address.', 'error');
        emailRef.current?.focus();
        setLoading(false);
        return;
      }
      
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        showToast(`Password must contain: ${passwordErrors.join(', ')}.`, 'error');
        passwordRef.current?.focus();
        setLoading(false);
        return;
      }
    }

    showToast('Attempting to register...', 'info');

    try {
      const response = await api.post<AuthResponse>('/api/auth/register', {
        name, email, password, dob, mobileNumber, username, gender
      } as RegisterRequest);

      const data = response.data;

      if (response.status === 201) {
        showToast(data.message || 'Registration successful! Please check your email for verification.', 'success');
      } else {
        showToast(data.message || 'An unexpected error occurred.', 'error');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      if (isAxiosError(error)) {
        if (error.response && error.response.data && error.response.data.message) {
          showToast(error.response.data.message, 'error');
        } else if (error.message) {
          showToast(error.message, 'error');
        } else {
          showToast('An error occurred. Please try again.', 'error');
        }
      } else if (error instanceof Error) {
        showToast(error.message, 'error');
      } else {
        showToast('An error occurred. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [name, email, password, confirmPassword, dob, mobileNumber, username, gender, step, validateEmail, validatePassword, showToast]);

  return (
    <div className="text-center">
      <h1 className="text-4xl font-extrabold mb-6 text-text-light dark:text-text-dark">Register</h1>
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl text-left">
        {step === 1 && (
          <PersonalDetailsForm
            name={name}
            setName={setName}
            dob={dob}
            setDob={setDob}
            mobileNumber={mobileNumber}
            setMobileNumber={setMobileNumber}
            gender={gender}
            setGender={setGender}
            loading={loading}
            nameRef={nameRef}
            handleNext={handleNext}
          />
        )}

        {step === 2 && (
          <AccountInformationForm
            email={email}
            setEmail={setEmail}
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            loading={loading}
            emailRef={emailRef}
            usernameRef={usernameRef}
            passwordRef={passwordRef}
            confirmPasswordRef={confirmPasswordRef}
            handlePrevious={handlePrevious}
          />
        )}
      </form>
      <p className="mt-[20px] text-gray-700 dark:text-gray-300">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
