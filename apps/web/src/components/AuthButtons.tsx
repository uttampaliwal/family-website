import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from './Button';

const AuthButtons: React.FC = () => {
  const location = useLocation();
  const showAuthButtons = location.pathname !== '/signin' && location.pathname !== '/register';

  return (
    <>
      {showAuthButtons && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/signin"><Button label="Login" /></Link>
          <Link to="/register"><Button label="Register" style={{ marginLeft: '10px' }} /></Link>
        </div>
      )}
    </>
  );
};

export default AuthButtons;