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
    <div className="text-center my-12 relative">
      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-gradient-to-br from-accent/10 to-primary/10 rounded-full blur-2xl"></div>
      </div>

      {/* Sanskrit and English Family Name */}
      <div className="mb-6">
        <h1
          className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2"
          style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive" }}
        >
          युवा कुल्या
        </h1>
        <h2 className="text-3xl md:text-4xl font-semibold text-primary/80 mb-4 font-playfair-display text-lg">
          Yuva Kulya
        </h2>
        <p className="text-lg text-muted italic">
          "Where Young Hearts Unite as One Family"
        </p>
      </div>

      {/* Personal Greeting */}
      <div className="bg-gradient-to-r from-surface/50 to-background/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-primary/20">
        <h3 className="text-2xl md:text-3xl font-bold gradient-text mb-2">
          {greeting}, {user?.name || "Dear Family Member"}!
        </h3>
        <p className="body-lg text-readable-muted">
          Welcome to our vibrant family portal where memories are made and bonds
          grow stronger.
        </p>
      </div>
    </div>
  );
};

export default WelcomeMessage;
