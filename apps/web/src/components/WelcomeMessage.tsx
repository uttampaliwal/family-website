import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const WelcomeMessage: React.FC = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good Morning';
      if (hour < 18) return 'Good Afternoon';
      return 'Good Evening';
    };
    setGreeting(getGreeting());
  }, []);

  return (
    <div className="text-center my-8">
      <h1 className="text-4xl font-bold gradient-text">
        {greeting}, {user?.name || 'Guest'}!
      </h1>
      <p className="text-lg text-text-muted mt-2">Welcome to the family portal.</p>
    </div>
  );
};

export default WelcomeMessage;
