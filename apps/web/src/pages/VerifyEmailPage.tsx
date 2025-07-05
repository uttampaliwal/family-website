import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string>('Verifying your email...');
  const [isError, setIsError] = useState<boolean>(false);
  const hasVerified = useRef(false); // Ref to prevent multiple calls

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setMessage('Verification token not found.');
      setIsError(true);
      return;
    }

    if (hasVerified.current) {
      return; // Prevent multiple verification attempts
    }

    hasVerified.current = true; // Mark as attempted

    const verifyEmail = async () => {
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
          setMessage(data.message || 'Email verified successfully! You can now login.');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          if (response.status === 400) {
            setMessage(data.message || 'Bad Request.');
          } else if (response.status === 500) {
            setMessage('Server error. Please try again later.');
          } else {
            setMessage(data.message || 'An unexpected error occurred.');
          }
          setIsError(true);
        }
      } catch (error) {
        console.error('Error during email verification:', error);
        if (error instanceof TypeError) {
          setMessage('Network error. Please check your internet connection or try again later.');
        } else {
          setMessage('An error occurred during verification. Please try again.');
        }
        setIsError(true);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="text-center mt-[50px]">
      <h1>Email Verification</h1>
      <p role="alert" className={`${isError ? 'text-red-500' : 'text-green-500'}`}>{message}</p>
      {!isError && message.includes('successfully') && (
        <p>Redirecting to login page...</p>
      )}
    </div>
  );
};

export default VerifyEmailPage;
