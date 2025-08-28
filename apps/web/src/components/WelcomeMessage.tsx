import React from "react";
import { useAuth } from "../hooks/useAuth";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

const WelcomeMessage: React.FC = () => {
  const { user } = useAuth();
  const greeting = getGreeting();

  return (
    <div className="text-center my-8">
      <h1 className="display-1 gradient-text">
        {greeting}, {user?.name || "Guest"}!
      </h1>
      <p className="body-lg text-readable-muted mt-3">
        Welcome to the family portal.
      </p>
    </div>
  );
};

export default WelcomeMessage;
