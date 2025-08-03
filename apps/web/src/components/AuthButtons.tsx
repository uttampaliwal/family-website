import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from './Button';
import { useAuth } from '../hooks/useAuth';

// Constants for better maintainability
const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile'
} as const;

const EXCLUDED_PATHS = [ROUTES.LOGIN, ROUTES.REGISTER];

const AuthButtons: React.FC = () => {
  const location = useLocation();
  const { isLoggedIn, username } = useAuth();
  const showAuthButtons = !EXCLUDED_PATHS.includes(location.pathname as typeof EXCLUDED_PATHS[number]);

  const renderAuthenticatedButtons = () => (
    <Link to={ROUTES.PROFILE}>
      <Button label={username || 'Profile'} />
    </Link>
  );

  const renderUnauthenticatedButtons = () => (
    <>
      <Link to={ROUTES.LOGIN}>
        <Button label="Login" />
      </Link>
      <Link to={ROUTES.REGISTER}>
        <Button label="Register" className="ml-2.5" isPrimary={true} />
      </Link>
    </>
  );

  if (!showAuthButtons) return null;

  return (
    <div className="text-center mt-5">
      {isLoggedIn ? renderAuthenticatedButtons() : renderUnauthenticatedButtons()}
    </div>
  );
};

export default AuthButtons;