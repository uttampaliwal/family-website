import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

// Constants for better maintainability
const REDIRECT_DELAY = 3000;
const MESSAGES = {
  VERIFYING: 'Verifying your email...',
  TOKEN_NOT_FOUND: 'Verification token not found.',
  SUCCESS: 'Email verified successfully! You can now login.',
  BAD_REQUEST: 'Bad Request.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NETWORK_ERROR: 'Network error. Please check your internet connection or try again later.',
  CANCELLED: 'Request was cancelled. Please try again.',
  GENERIC_ERROR: 'An error occurred during verification. Please try again.',
  UNEXPECTED_ERROR: 'An unexpected error occurred.'
} as const;

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string>(MESSAGES.VERIFYING);
  const [isError, setIsError] = useState<boolean>(false);
  const hasVerified = useRef(false);

  const verifyEmail = useCallback(async (token: string) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();

        if (response.ok) {
          setMessage(data.message || MESSAGES.SUCCESS);
          setTimeout(() => {
            navigate('/login');
          }, REDIRECT_DELAY);
        } else {
          if (response.status === 400) {
            setMessage(data.message || MESSAGES.BAD_REQUEST);
          } else if (response.status === 500) {
            setMessage(MESSAGES.SERVER_ERROR);
          } else {
            setMessage(data.message || MESSAGES.UNEXPECTED_ERROR);
          }
          setIsError(true);
        }
      } catch (error) {
        // Structured error logging with context
        const errorInfo = {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: error instanceof TypeError ? 'NetworkError' : 'UnknownError',
          timestamp: new Date().toISOString(),
          operation: 'emailVerification',
          token: token ? 'present' : 'missing'
        };
        console.error('Error during email verification:', JSON.stringify(errorInfo));
        
        if (error instanceof TypeError) {
          setMessage(MESSAGES.NETWORK_ERROR);
        } else if (error instanceof Error && error.name === 'AbortError') {
          setMessage(MESSAGES.CANCELLED);
        } else {
          setMessage(MESSAGES.GENERIC_ERROR);
        }
        setIsError(true);
      }
  }, [navigate]);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setMessage(MESSAGES.TOKEN_NOT_FOUND);
      setIsError(true);
      return;
    }

    if (hasVerified.current) {
      return;
    }

    hasVerified.current = true;
    verifyEmail(token);
  }, [searchParams, verifyEmail]);

  return (
    <div className="text-center">
      <h1 className="text-gray-800 dark:text-white">Email Verification</h1>
      <p role="alert" className={`${isError ? 'text-red-500' : 'text-green-500'}`}>{message}</p>
      {!isError && message.includes('successfully') && (
        <p className="text-gray-700 dark:text-gray-300">Redirecting to login page...</p>
      )}
    </div>
  );
};

export default VerifyEmailPage;
