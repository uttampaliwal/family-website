import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggleButton from "./ThemeToggleButton";

interface HamburgerMenuProps {
  isLoggedIn: boolean;
  username: string | null;
}

function HamburgerMenu({ isLoggedIn, username }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const sanitizeUsername = (name: string | null) => {
    if (!name || typeof name !== "string") {
      return "User";
    }
    return String(name).replace(/[<>"'&]/g, "");
  };

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-base hover:bg-surface/20 transition-colors duration-200 focus:outline-none"
        aria-label="Menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          ></path>
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 right-0 w-48 card rounded-lg shadow-xl z-50 overflow-hidden"
          >
            <div className="h-1 w-full gradient-bg"></div>

            {/* Mobile Search - Only for logged in users */}
            {isLoggedIn && (
              <div className="px-4 py-3 border-b border-border/50">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      navigate(
                        `/documents?search=${encodeURIComponent(searchQuery.trim())}`,
                      );
                      setIsOpen(false);
                      setSearchQuery("");
                    }
                  }}
                >
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search documents..."
                      className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-text-base text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      aria-label="Search documents and content"
                    />
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </form>
              </div>
            )}

            <div className="py-2">
              <Link
                to="/"
                className="block px-4 py-2 text-text-base hover:bg-primary/10 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>

              {isLoggedIn && (
                <Link
                  to="/documents"
                  className="block px-4 py-2 text-text-base hover:bg-primary/10 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  Documents
                </Link>
              )}

              {isLoggedIn && (
                <Link
                  to="/family-tree"
                  className="block px-4 py-2 text-text-base hover:bg-primary/10 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  Family Tree
                </Link>
              )}

              {isLoggedIn && (
                <Link
                  to="/chat"
                  className="block px-4 py-2 text-text-base hover:bg-primary/10 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  Chat
                </Link>
              )}

              {isLoggedIn && (
                <Link
                  to="/social-ultimate"
                  className="block px-4 py-2 text-text-base hover:bg-primary/10 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  Social
                </Link>
              )}

              {isLoggedIn ? (
                <Link
                  to={`/profile/${sanitizeUsername(username).toLowerCase()}`}
                  className="block px-4 py-2 text-text-base hover:bg-primary/10 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  {sanitizeUsername(username)}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-4 py-2 text-primary font-medium hover:bg-primary/10 transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-2 text-secondary font-medium hover:bg-primary/10 transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}

              {/* Theme Toggle */}
              <div className="px-4 py-3 border-t border-border/50 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-base">
                    Theme
                  </span>
                  <ThemeToggleButton />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HamburgerMenu;
