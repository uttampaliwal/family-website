import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string>('Verifying your email...');
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setMessage('Verification token not found.');
      setIsError(true);
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setMessage(data.message || 'Email verified successfully! You can now sign in.');
          setTimeout(() => {
            navigate('/login');
          }, 3000); // Redirect to sign-in after 3 seconds
        } else {
          setMessage(data.message || 'Email verification failed.');
          setIsError(true);
        }
      } catch (error) {
        console.error('Error during email verification:', error);
        setMessage('An error occurred during verification. Please try again.');
        setIsError(true);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="text-center mt-[50px]">
      <h1>Email Verification</h1>
      <p className={`${isError ? 'text-red-500' : 'text-green-500'}`}>{message}</p>
      {!isError && message.includes('successfully') && (
        <p>Redirecting to login page...</p>
      )}
    </div>
  );
};

export default VerifyEmailPage;
