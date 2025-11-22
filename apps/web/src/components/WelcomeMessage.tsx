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
    <div className="text-center my-8 relative">
      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-gradient-to-br from-accent/10 to-primary/10 rounded-full blur-2xl"></div>
      </div>

      {/* Personal Greeting */}
      <div className="bg-surface rounded-2xl p-8 shadow-xl border border-primary/10 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-50"></div>
        <h3 className="text-3xl md:text-4xl font-bold text-primary mb-3 font-serif tracking-tight">
          {greeting}, {user?.name || "Family Member"}
        </h3>
        <p className="text-text-muted text-lg max-w-2xl mx-auto">
          Welcome to your family's digital sanctuary.
        </p>
      </div>
    </div>
  );
};

export default WelcomeMessage;
