import React, { useState, useEffect } from 'react';
import Button from './Button';

interface AccountInformationFormProps {
  email: string;
  setEmail: (email: string) => void;
  username: string;
  setUsername: (username: string) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  showPassword: boolean;
  setShowPassword: (showPassword: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (showConfirmPassword: boolean) => void;
  loading: boolean;
  emailRef: React.RefObject<HTMLInputElement | null>;
  usernameRef: React.RefObject<HTMLInputElement | null>;
  passwordRef: React.RefObject<HTMLInputElement | null>;
  confirmPasswordRef: React.RefObject<HTMLInputElement | null>;
  handlePrevious: () => void;
}

const AccountInformationForm: React.FC<AccountInformationFormProps> = ({
  email,
  setEmail,
  username,
  setUsername,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  loading,
  emailRef,
  usernameRef,
  passwordRef,
  confirmPasswordRef,
  handlePrevious,
}) => {
  return (
    <div className="mb-8 p-8 bg-white dark:bg-gray-900 rounded-xl shadow-xl">
      <h2 className="text-2xl font-extrabold mb-6 text-gray-800 dark:text-gray-100">Account Information</h2>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center">
        <label htmlFor="email" className="mb-2 sm:mb-0 sm:w-40 text-left sm:text-right mr-4 text-gray-700 dark:text-gray-300">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-required="true"
          disabled={loading}
          ref={emailRef}
          className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center">
        <label htmlFor="username" className="mb-2 sm:mb-0 sm:w-40 text-left sm:text-right mr-4 text-gray-700 dark:text-gray-300">Username:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          aria-required="true"
          disabled={loading}
          ref={usernameRef}
          className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center relative">
        <label htmlFor="password" className="mb-2 sm:mb-0 sm:w-40 text-left sm:text-right mr-4 text-gray-700 dark:text-gray-300">Password:</label>
        <input
          type={showPassword ? 'text' : 'password'}
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          aria-required="true"
          disabled={loading}
          ref={passwordRef}
          className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white focus:outline-none text-sm"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center relative">
        <label htmlFor="confirmPassword" className="mb-2 sm:mb-0 sm:w-40 text-left sm:text-right mr-4 text-gray-700 dark:text-gray-300">Confirm Password:</label>
        <input
          type={showConfirmPassword ? 'text' : 'password'}
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          aria-required="true"
          disabled={loading}
          ref={confirmPasswordRef}
          className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white focus:outline-none text-sm"
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
  );
};

export default React.memo(AccountInformationForm);