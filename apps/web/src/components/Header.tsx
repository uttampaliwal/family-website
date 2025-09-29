import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import HamburgerMenu from "./HamburgerMenu";
import ThemeToggleButton from "./ThemeToggleButton";
import LiveDateTime from "./LiveDateTime";
import AuthButtons from "./AuthButtons";
import UserMenu from "./UserMenu";

interface HeaderProps {
  scrolled: boolean;
}

const Header = ({ scrolled }: HeaderProps) => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // For now, navigate to documents page with search term
      // Future: implement global search results page
      navigate(`/documents?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header
      role="banner"
      className={`fixed top-0 left-0 w-full z-20 transition-all duration-300 ${
        scrolled ? "shadow-xl py-2" : "py-4"
      } navbar-glass`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-sm opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <img
                src="/family-logo.svg"
                className="h-20 object-contain transition-all duration-300 group-hover:scale-110 relative z-10"
                alt="Family Website"
              />
              <div className="absolute inset-0 rounded-full border-2 border-secondary/30 group-hover:border-secondary/50 transition-all duration-300 scale-105"></div>
            </div>
            <div className="ml-4 hidden sm:block">
              <span className="text-3xl font-extrabold tracking-wide">
                Family <span className="text-secondary">Portal</span>
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center">
          {/* Global Search Bar */}
          <div className="hidden lg:flex items-center mr-6">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search documents, family members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 px-4 py-2 pl-10 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-sm"
              />
              <button
                type="submit"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Search"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </form>
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <Link
              to="/"
              className="p-2 rounded-md hover:bg-primary/10 transition-colors duration-300"
            >
              Home
            </Link>

            {isLoggedIn && (
              <Link
                to="/documents"
                className="p-2 rounded-md hover:bg-primary/10 transition-colors duration-300"
              >
                Documents
              </Link>
            )}

            {isLoggedIn && (
              <Link
                to="/family-tree"
                className="p-2 rounded-md hover:bg-primary/10 transition-colors duration-300"
              >
                Family Tree
              </Link>
            )}

            {isLoggedIn && (
              <Link
                to="/chat"
                className="p-2 rounded-md hover:bg-primary/10 transition-colors duration-300"
              >
                Chat
              </Link>
            )}

            {isLoggedIn && (
              <Link
                to="/social-ultimate"
                className="p-2 rounded-md hover:bg-primary/10 transition-colors duration-300"
              >
                Social
              </Link>
            )}

            {isLoggedIn && user?.role === "admin" && (
              <Link
                to="/admin"
                className="p-2 rounded-md hover:bg-primary/10 transition-colors duration-300 admin-link"
              >
                🛡️ Admin Dashboard
              </Link>
            )}

            {isLoggedIn ? <UserMenu /> : <AuthButtons />}
          </div>

          <div className="hidden lg:block mx-4">
            <LiveDateTime />
          </div>

          <div className="ml-4">
            <ThemeToggleButton />
          </div>

          <div className="md:hidden ml-4">
            <HamburgerMenu
              isLoggedIn={isLoggedIn}
              username={user?.username || ""}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
