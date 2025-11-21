import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import ThemeToggleButton from "./ThemeToggleButton";
import SearchModal from "./SearchModal";
import {
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  CameraIcon,
  UsersIcon,
  CalendarIcon,
  BellIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface OptimizedModernNavbarProps {
  scrolled: boolean;
}

// Navigation structure with dropdowns
const navigationConfig = {
  main: [{ to: "/", label: "Home", icon: HomeIcon }],
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
        to: "/family-chat",
        label: "Family Chat",
        icon: ChatBubbleLeftRightIcon,
        description: "Stay connected with family",
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
  account: {
    label: "Account",
    icon: UserCircleIcon,
    items: [
      {
        to: "/profile",
        label: "Profile",
        icon: UserCircleIcon,
        description: "Manage your profile",
      },
      {
        to: "/settings",
        label: "Settings",
        icon: Cog6ToothIcon,
        description: "Account preferences",
      },
      {
        to: "/notifications",
        label: "Notifications",
        icon: BellIcon,
        description: "Manage notifications",
      },
    ],
  },
};

const OptimizedModernNavbar: React.FC<OptimizedModernNavbarProps> = ({
  scrolled,
}) => {
  const { isLoggedIn, user, logout } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const navigate = useNavigate();

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
      }
      if (event.key === "Escape") {
        setIsSearchOpen(false);
        setOpenDropdown(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setOpenDropdown(null);
      setIsMobileMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
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
          className="absolute top-full left-0 mt-2 w-72 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50"
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
                className="group flex items-center p-3 rounded-lg hover:bg-white/10 transition-all duration-200 text-white/90 hover:text-white"
              >
                <item.icon className="h-5 w-5 mr-3 text-secondary group-hover:text-primary transition-colors" />
                <div>
                  <div className="font-medium text-sm">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-white/60 group-hover:text-white/80">
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
        {/* Enhanced gradient overlay */}
        <div className="absolute inset-0 navbar-gradient opacity-90"></div>

        {/* Subtle animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="hero-pattern animate-pulse"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between">
            {/* Logo Section - Enhanced */}
            <Link
              to="/"
              className="flex items-center group"
              aria-label="Family Portal Home"
            >
              <div className="relative">
                {/* Enhanced glossy effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-sm opacity-70 group-hover:opacity-90 transition-opacity duration-300"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <span className="text-white font-bold text-lg">🏠</span>
                </div>
              </div>
              <div className="ml-3 hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                  Family Portal
                </h1>
                <p className="text-xs text-white/70 font-medium tracking-wide">
                  Stay Connected
                </p>
              </div>
            </Link>

            {/* Center Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                <input
                  type="text"
                  placeholder="Search documents, family members..."
                  onClick={() => setIsSearchOpen(true)}
                  readOnly
                  className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary/50 transition-all duration-200 cursor-pointer"
                />
              </div>
            </div>

            {/* Navigation Links - Optimized with Dropdowns */}
            <div className="hidden lg:flex items-center space-x-1">
              {/* Home Link */}
              <Link
                to="/"
                className="flex items-center px-4 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium"
              >
                <HomeIcon className="h-5 w-5 mr-2" />
                Home
              </Link>

              {isLoggedIn && (
                <>
                  {/* Family Dropdown */}
                  <div
                    className="relative"
                    ref={(el) => (dropdownRefs.current.family = el)}
                  >
                    <button
                      onClick={() => toggleDropdown("family")}
                      className="flex items-center px-4 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium"
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
                      className="flex items-center px-4 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium"
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
                </>
              )}
            </div>

            {/* Right Section - Enhanced */}
            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              <ThemeToggleButton />

              {/* User Menu or Auth Buttons */}
              {isLoggedIn && user ? (
                <div
                  className="relative"
                  ref={(el) => (dropdownRefs.current.account = el)}
                >
                  <button
                    onClick={() => toggleDropdown("account")}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
                    aria-label={`Account menu for ${user.username}`}
                  >
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={`${user.username}'s profile`}
                        className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm border-2 border-white/30">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <ChevronDownIcon
                      className={`h-4 w-4 text-white/70 transition-transform duration-200 ${openDropdown === "account" ? "rotate-180" : ""}`}
                    />
                  </button>

                  <DropdownMenu
                    items={[
                      ...navigationConfig.account.items,
                      {
                        to: "#",
                        label: "Sign Out",
                        icon: ArrowRightOnRectangleIcon,
                        description: "Logout from your account",
                        onClick: handleLogout,
                      },
                    ]}
                    isOpen={openDropdown === "account"}
                    onClose={() => setOpenDropdown(null)}
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-all duration-200 border border-white/20 hover:border-white/30"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-secondary to-primary hover:from-primary hover:to-secondary text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6 text-white" />
                ) : (
                  <Bars3Icon className="h-6 w-6 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden border-t border-white/20 bg-black/20 backdrop-blur-sm"
            >
              <div className="container mx-auto px-4 py-4 space-y-2">
                {/* Mobile Search */}
                <div className="relative mb-4">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-secondary/50"
                  />
                </div>

                {/* Mobile Navigation Links */}
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center p-3 rounded-lg hover:bg-white/10 text-white transition-colors duration-200"
                >
                  <HomeIcon className="h-5 w-5 mr-3" />
                  Home
                </Link>

                {isLoggedIn && (
                  <>
                    {navigationConfig.family.items.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center p-3 rounded-lg hover:bg-white/10 text-white transition-colors duration-200"
                      >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.label}
                      </Link>
                    ))}

                    {navigationConfig.documents.items.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center p-3 rounded-lg hover:bg-white/10 text-white transition-colors duration-200"
                      >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.label}
                      </Link>
                    ))}

                    <div className="border-t border-white/20 mt-4 pt-4">
                      <button
                        onClick={handleLogout}
                        className="flex items-center p-3 rounded-lg hover:bg-red-500/20 text-white transition-colors duration-200 w-full"
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}

                {!isLoggedIn && (
                  <div className="flex space-x-3 mt-4">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 text-center px-4 py-2 rounded-lg bg-white/10 text-white transition-colors duration-200"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 text-center px-4 py-2 rounded-lg bg-gradient-to-r from-secondary to-primary text-white transition-colors duration-200"
                    >
                      Register
                    </Link>
                  </div>
                )}

                {/* Mobile Theme Toggle */}
                <div className="pt-4 border-t border-white/20 mt-4">
                  <div className="flex justify-center">
                    <ThemeToggleButton />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};

export default OptimizedModernNavbar;
