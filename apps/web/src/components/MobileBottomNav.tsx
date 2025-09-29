import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const MobileBottomNav: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) return null;

  const navItems = [
    {
      path: "/",
      label: "Home",
      icon: "🏠",
      activeIcon: "🏠",
    },
    {
      path: "/documents",
      label: "Docs",
      icon: "📄",
      activeIcon: "📄",
    },
    {
      path: "/family-tree",
      label: "Family",
      icon: "🌳",
      activeIcon: "🌳",
    },
    {
      path: "/chat",
      label: "Chat",
      icon: "💬",
      activeIcon: "💬",
    },
    {
      path: "/social-enhanced",
      label: "Social",
      icon: "📸",
      activeIcon: "📸",
    },
  ];

  const isActivePath = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const isActive = isActivePath(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors duration-200 ${
                  isActive
                    ? "text-primary"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                }`}
              >
                <span className="text-xl">
                  {isActive ? item.activeIcon : item.icon}
                </span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="md:hidden h-16" />
    </>
  );
};

export default MobileBottomNav;
