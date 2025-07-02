import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from './Button';

const AuthButtons: React.FC = () => {
  const location = useLocation();
  const showAuthButtons = location.pathname !== '/signin' && location.pathname !== '/signup';

  return (
    <>
      {showAuthButtons && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/signin"><Button label="Sign In" /></Link>
          <Link to="/signup"><Button label="Sign Up" style={{ marginLeft: '10px' }} /></Link>
        </div>
      )}
    </>
  );
};

export default AuthButtons;