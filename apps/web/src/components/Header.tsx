import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HamburgerMenu from "./HamburgerMenu";
import ThemeToggleButton from "./ThemeToggleButton";
import LiveDateTime from "./LiveDateTime";
import AuthButtons from "./AuthButtons";
import UserMenu from "./UserMenu";
import {
  ChevronDownIcon,
  HomeIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  CameraIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

interface HeaderProps {
  scrolled: boolean;
}

// Navigation structure with organized dropdowns
const navigationConfig = {
  // Public navigation (available to all users)
  public: {
    features: {
      label: "Features",
      icon: UserGroupIcon,
      items: [
        {
          to: "/features/family-tree",
          label: "Family Tree",
          icon: UsersIcon,
          description: "Connect your family heritage",
        },
        {
          to: "/features/chat",
          label: "Family Chat",
          icon: ChatBubbleLeftRightIcon,
          description: "Stay connected with loved ones",
        },
        {
          to: "/features/documents",
          label: "Document Sharing",
          icon: DocumentTextIcon,
          description: "Share important family documents",
        },
        {
          to: "/features/photos",
          label: "Photo Gallery",
          icon: CameraIcon,
          description: "Preserve precious memories",
        },
      ],
    },
  },
  // Authenticated navigation (for logged-in users)
  family: {
    label: "Family",
    icon: UsersIcon,
    items: [
      {
        to: "/family-tree",
        label: "Family Tree",
        icon: UsersIcon,
        description: "Explore your family connections",
      },
      {
        to: "/chat",
        label: "Family Chat",
        icon: ChatBubbleLeftRightIcon,
        description: "Stay connected with family",
      },
      {
        to: "/social-ultimate",
        label: "Social Feed",
        icon: UserGroupIcon,
        description: "Share moments & updates",
      },
      {
        to: "/family-photos",
        label: "Photos",
        icon: CameraIcon,
        description: "Share precious memories",
      },
      {
        to: "/family-calendar",
        label: "Calendar",
        icon: CalendarIcon,
        description: "Family events & schedules",
      },
    ],
  },
  documents: {
    label: "Documents",
    icon: DocumentTextIcon,
    items: [
      {
        to: "/documents",
        label: "All Documents",
        icon: DocumentTextIcon,
        description: "View all documents",
      },
      {
        to: "/documents/shared",
        label: "Shared",
        icon: UserGroupIcon,
        description: "Shared with family",
      },
      {
        to: "/documents/recent",
        label: "Recent",
        icon: ClockIcon,
        description: "Recently viewed",
      },
    ],
  },
};

const Header = ({ scrolled }: HeaderProps) => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isClickInside = Object.values(dropdownRefs.current).some((ref) =>
        ref?.contains(event.target as Node),
      );
      if (!isClickInside) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // For now, navigate to documents page with search term
      // Future: implement global search results page
      navigate(`/documents?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const DropdownMenu = ({
    items,
    isOpen,
    onClose,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: any[];
    isOpen: boolean;
    onClose: () => void;
  }) => (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute top-full left-0 mt-2 w-72 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50 dark:bg-gray-900/80"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
          }}
        >
          <div className="p-2">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className="group flex items-center p-3 rounded-lg hover:bg-white/10 dark:hover:bg-gray-700/50 transition-all duration-200 text-text-base dark:text-white/90 hover:text-primary dark:hover:text-white"
              >
                <item.icon className="h-5 w-5 mr-3 text-secondary group-hover:text-primary transition-colors" />
                <div>
                  <div className="font-medium text-sm">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-text-muted dark:text-white/60 group-hover:text-text-base dark:group-hover:text-white/80">
                      {item.description}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

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

          <div className="hidden md:flex items-center space-x-1">
            {/* Home Link */}
            <Link
              to="/"
              className="flex items-center px-3 py-2 rounded-lg text-text-base dark:text-white/90 hover:text-primary dark:hover:text-white hover:bg-primary/10 dark:hover:bg-white/10 transition-all duration-200 font-medium"
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Home
            </Link>

            {/* Features dropdown for non-logged users */}
            {!isLoggedIn && (
              <div
                className="relative"
                ref={(el) => (dropdownRefs.current.features = el)}
              >
                <button
                  onClick={() => toggleDropdown("features")}
                  className="flex items-center px-3 py-2 rounded-lg text-text-base dark:text-white/90 hover:text-primary dark:hover:text-white hover:bg-primary/10 dark:hover:bg-white/10 transition-all duration-200 font-medium"
                >
                  <UserGroupIcon className="h-5 w-5 mr-2" />
                  Features
                  <ChevronDownIcon
                    className={`h-4 w-4 ml-1 transition-transform duration-200 ${openDropdown === "features" ? "rotate-180" : ""}`}
                  />
                </button>
                <DropdownMenu
                  items={navigationConfig.public.features.items}
                  isOpen={openDropdown === "features"}
                  onClose={() => setOpenDropdown(null)}
                />
              </div>
            )}

            {isLoggedIn && (
              <>
                {/* Family Dropdown */}
                <div
                  className="relative"
                  ref={(el) => (dropdownRefs.current.family = el)}
                >
                  <button
                    onClick={() => toggleDropdown("family")}
                    className="flex items-center px-3 py-2 rounded-lg text-text-base dark:text-white/90 hover:text-primary dark:hover:text-white hover:bg-primary/10 dark:hover:bg-white/10 transition-all duration-200 font-medium"
                  >
                    <UsersIcon className="h-5 w-5 mr-2" />
                    Family
                    <ChevronDownIcon
                      className={`h-4 w-4 ml-1 transition-transform duration-200 ${openDropdown === "family" ? "rotate-180" : ""}`}
                    />
                  </button>
                  <DropdownMenu
                    items={navigationConfig.family.items}
                    isOpen={openDropdown === "family"}
                    onClose={() => setOpenDropdown(null)}
                  />
                </div>

                {/* Documents Dropdown */}
                <div
                  className="relative"
                  ref={(el) => (dropdownRefs.current.documents = el)}
                >
                  <button
                    onClick={() => toggleDropdown("documents")}
                    className="flex items-center px-3 py-2 rounded-lg text-text-base dark:text-white/90 hover:text-primary dark:hover:text-white hover:bg-primary/10 dark:hover:bg-white/10 transition-all duration-200 font-medium"
                  >
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Documents
                    <ChevronDownIcon
                      className={`h-4 w-4 ml-1 transition-transform duration-200 ${openDropdown === "documents" ? "rotate-180" : ""}`}
                    />
                  </button>
                  <DropdownMenu
                    items={navigationConfig.documents.items}
                    isOpen={openDropdown === "documents"}
                    onClose={() => setOpenDropdown(null)}
                  />
                </div>

                {/* Admin Link (if admin) */}
                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="flex items-center px-3 py-2 rounded-lg text-text-base dark:text-white/90 hover:text-primary dark:hover:text-white hover:bg-primary/10 dark:hover:bg-white/10 transition-all duration-200 font-medium admin-link"
                  >
                    <ShieldCheckIcon className="h-5 w-5 mr-2" />
                    Admin
                  </Link>
                )}
              </>
            )}

            {/* User Menu or Auth Buttons */}
            <div className="ml-2">
              {isLoggedIn ? <UserMenu /> : <AuthButtons />}
            </div>
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
