import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

interface UserMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ isOpen, onToggle }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={onToggle}
        className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 focus:outline-none ${
          isOpen
            ? "text-primary bg-primary/10"
            : "text-text-muted hover:text-primary hover:bg-primary/5"
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-sm">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <span className="font-medium hidden md:block">{user.username}</span>
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <Transition
        show={isOpen}
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95 -translate-y-2"
        enterTo="transform opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100 translate-y-0"
        leaveTo="transform opacity-0 scale-95 -translate-y-2"
      >
        <div
          className="absolute right-0 mt-2 w-56 origin-top-right bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50 dark:bg-gray-900/80 focus:outline-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
          }}
        >
          <div className="p-1">
            <div className="px-3 py-2 border-b border-white/10 mb-1">
              <p className="text-xs text-text-muted dark:text-white/60">
                Signed in as
              </p>
              <p className="font-medium text-text-base dark:text-white truncate">
                {user.username}
              </p>
            </div>

            <Link
              to={`/profile/${encodeURIComponent(user.username)}`}
              onClick={onToggle}
              className="group flex items-center w-full px-3 py-2 text-sm rounded-lg text-text-base dark:text-white/90 hover:bg-white/5 dark:hover:bg-gray-700/30 transition-all duration-200"
            >
              <span className="mr-3">👤</span>
              Profile
            </Link>

            <Link
              to="/settings"
              onClick={onToggle}
              className="group flex items-center w-full px-3 py-2 text-sm rounded-lg text-text-base dark:text-white/90 hover:bg-white/5 dark:hover:bg-gray-700/30 transition-all duration-200"
            >
              <span className="mr-3">⚙️</span>
              Settings
            </Link>

            <div className="border-t border-white/10 mt-1 pt-1">
              <button
                onClick={() => {
                  logout();
                  onToggle();
                }}
                className="group flex items-center w-full px-3 py-2 text-sm rounded-lg text-red-500 hover:bg-red-500/10 transition-all duration-200"
              >
                <span className="mr-3">🚪</span>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default UserMenu;
