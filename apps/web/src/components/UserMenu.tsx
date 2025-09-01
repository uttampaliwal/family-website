import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Link
        to={`/profile/${encodeURIComponent(user.username)}`}
        className="p-2 rounded-md hover:bg-primary/10 transition-colors duration-300"
      >
        {user.username}
      </Link>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg py-1 z-50 animate-fade-in">
          <Link
            to={`/profile/${encodeURIComponent(user.username)}`}
            className="block px-4 py-2 text-sm text-text-base hover:bg-primary/10"
          >
            Profile
          </Link>
          <button
            onClick={logout}
            className="block w-full text-left px-4 py-2 text-sm text-text-base hover:bg-primary/10"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
