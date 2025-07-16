import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from './Button';
import { useAuth } from '../hooks/useAuth';

const AuthButtons: React.FC = () => {
  const location = useLocation();
  const { isLoggedIn, username } = useAuth();
  const showAuthButtons = location.pathname !== '/login' && location.pathname !== '/register';

  return (
    <>
      {showAuthButtons && (
        <div className="text-center mt-[20px]">
          {isLoggedIn ? (
            <Link to="/profile"><Button label={username || 'Profile'} /></Link>
          ) : (
            <>
              <Link to="/login"><Button label="Login" /></Link>
              <Link to="/register"><Button label="Register" className="ml-[10px]" isPrimary={true} /></Link>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AuthButtons;