import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";

interface ModernNavbarProps {
  scrolled: boolean;
}

const ModernNavbar: React.FC<ModernNavbarProps> = ({ scrolled }) => {
  const { isLoggedIn, user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navLinks = [
    { to: "/", label: "Home", icon: "🏠" },
    ...(isLoggedIn
      ? [
          { to: "/documents", label: "Documents", icon: "📄" },
          { to: "/family-tree", label: "Family Tree", icon: "🌳" },
        ]
      : []),
  ];

  return (
    <>
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <nav
        role="banner"
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "py-2 shadow-2xl" : "py-4"
        } modern-navbar-glass`}
        aria-label="Main navigation"
      >
        {/* Gradient overlay for modern effect */}
        <div className="absolute inset-0 navbar-gradient opacity-80"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <Link
              to="/"
              className="flex items-center group"
              aria-label="Family Website Home"
            >
              <div className="relative">
                {/* Enhanced glossy effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-sm opacity-70 group-hover:opacity-90 transition-opacity duration-300"></div>
                <img
                  src="/family-logo.svg"
                  className="h-16 sm:h-20 object-contain transition-all duration-300 group-hover:scale-110 relative z-10"
                  alt="Family Website Logo"
                />
                {/* Enhanced accent ring */}
                <div className="absolute inset-0 rounded-full border-2 border-secondary/40 group-hover:border-secondary/70 transition-all duration-300 scale-105 animate-pulse"></div>
              </div>
              <div className="ml-3 sm:ml-4 hidden sm:block">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-wide text-white drop-shadow-lg">
                  Family <span className="text-secondary">Website</span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="modern-nav-link group"
                  aria-label={link.label}
                >
                  <span className="text-lg mr-2 group-hover:scale-110 transition-transform duration-200">
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              ))}

              {/* User Menu or Auth Buttons */}
              {isLoggedIn && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    onMouseEnter={() => setIsUserMenuOpen(true)}
                    className="modern-nav-link user-menu-trigger group"
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="true"
                    aria-label="User menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center mr-2 group-hover:scale-110 transition-transform duration-200">
                      <span className="text-white font-bold text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {user.username}
                    <svg
                      className={`w-4 h-4 ml-1 transition-transform duration-200 ${
                        isUserMenuOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* User Dropdown Menu */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-56 user-dropdown-menu"
                        onMouseLeave={() => setIsUserMenuOpen(false)}
                      >
                        <div className="py-2">
                          <div className="px-4 py-2 border-b border-white/10">
                            <p className="text-sm text-white/80">
                              Signed in as
                            </p>
                            <p className="font-medium text-white truncate">
                              {user.username}
                            </p>
                          </div>

                          <Link
                            to={`/profile/${encodeURIComponent(user.username)}`}
                            className="dropdown-item"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <span className="mr-3">👤</span>
                            View Profile
                          </Link>

                          <Link
                            to="/settings"
                            className="dropdown-item"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <span className="mr-3">⚙️</span>
                            Settings
                          </Link>

                          <div className="border-t border-white/10 mt-2 pt-2">
                            <button
                              onClick={handleLogout}
                              className="dropdown-item w-full text-left text-red-300 hover:text-red-200 hover:bg-red-500/20"
                            >
                              <span className="mr-3">🚪</span>
                              Sign Out
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login" className="btn btn-primary modern-auth-btn">
                    <span className="mr-2">🔑</span>
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-secondary modern-auth-btn"
                  >
                    <span className="mr-2">✨</span>
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white hover:bg-white/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={
                    isMobileMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="md:hidden mt-4 overflow-hidden"
              >
                <div className="mobile-menu-container">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="mobile-nav-link"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="text-lg mr-3">{link.icon}</span>
                      {link.label}
                    </Link>
                  ))}

                  {isLoggedIn && user ? (
                    <>
                      <div className="border-t border-white/20 my-2"></div>
                      <Link
                        to={`/profile/${encodeURIComponent(user.username)}`}
                        className="mobile-nav-link"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="text-lg mr-3">👤</span>
                        {user.username}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="mobile-nav-link w-full text-left text-red-300"
                      >
                        <span className="text-lg mr-3">🚪</span>
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="border-t border-white/20 my-2"></div>
                      <Link
                        to="/login"
                        className="mobile-nav-link text-secondary"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="text-lg mr-3">🔑</span>
                        Login
                      </Link>
                      <Link
                        to="/register"
                        className="mobile-nav-link text-accent"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="text-lg mr-3">✨</span>
                        Register
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </>
  );
};

export default ModernNavbar;
