import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HamburgerMenu from "./HamburgerMenu";
import ThemeToggleButton from "./ThemeToggleButton";
import AuthButtons from "./AuthButtons";
import UserMenu from "./UserMenu";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import {
  ChevronDownIcon,
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
  const { t } = useTranslation(); // Add useTranslation hook
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
          className="absolute top-full left-0 mt-2 w-72 bg-surface/98 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden z-[100]"
        >
          <div className="p-2">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className="group flex items-center p-3 rounded-lg hover:bg-primary/5 transition-all duration-200"
              >
                <item.icon className="h-5 w-5 mr-3 text-secondary group-hover:text-primary transition-colors" />
                <div>
                  <div className="font-medium text-sm text-text-base group-hover:text-primary transition-colors">
                    {item.label}
                  </div>
                  {item.description && (
                    <div className="text-xs text-text-muted group-hover:text-text-base transition-colors">
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
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b border-white/10 ${
        scrolled
          ? "bg-surface/95 backdrop-blur-md shadow-lg h-16"
          : "bg-surface/80 backdrop-blur-sm h-20"
      }`}
    >
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center w-[250px] shrink-0">
          <Link to="/" className="flex items-center group gap-3">
            <div
              className={`relative flex items-center justify-center bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-all duration-300 ${
                scrolled ? "w-10 h-10" : "w-14 h-14"
              }`}
            >
              <Logo
                className={`text-primary transition-all duration-300 ${
                  scrolled ? "w-6 h-6" : "w-9 h-9"
                }`}
              />
            </div>
            <div className="hidden sm:flex flex-col w-[180px]">
              <span className="text-xl font-bold text-text-base leading-tight tracking-tight truncate">
                {t("app.title")}
              </span>
              <span className="text-xs text-text-muted font-medium tracking-wide truncate">
                {t("app.subtitle")}
              </span>
            </div>
          </Link>
        </div>

        {/* Center Navigation & Search */}
        <div className="flex-1 flex items-center justify-center px-8">
          {/* Global Search Bar - Desktop */}
          <div className="hidden lg:block w-full max-w-md relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors"
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
            <form onSubmit={handleSearch}>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-border rounded-xl leading-5 bg-surface text-text-base placeholder:text-text-muted placeholder:opacity-70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 sm:text-sm"
                placeholder={t("home:searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 min-w-[450px] w-[450px] justify-end shrink-0">
          <div className="hidden md:flex items-center gap-1">
            {/* Features dropdown for non-logged users */}
            {!isLoggedIn && (
              <div
                className="relative"
                ref={(el) => {
                  dropdownRefs.current.features = el;
                }}
              >
                <button
                  onClick={() => toggleDropdown("features")}
                  className={`flex items-center justify-center w-[110px] h-10 px-3 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    openDropdown === "features"
                      ? "text-primary bg-primary/10"
                      : "text-text-base hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  {t("header.features")}
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
                  ref={(el) => {
                    dropdownRefs.current.family = el;
                  }}
                >
                  <button
                    onClick={() => toggleDropdown("family")}
                    className={`h-10 w-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
                      openDropdown === "family"
                        ? "text-primary bg-primary/10"
                        : "text-text-muted hover:text-primary hover:bg-primary/5"
                    }`}
                    title="Family"
                  >
                    <UsersIcon className="h-6 w-6" />
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
                  ref={(el) => {
                    dropdownRefs.current.documents = el;
                  }}
                >
                  <button
                    onClick={() => toggleDropdown("documents")}
                    className={`h-10 w-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
                      openDropdown === "documents"
                        ? "text-primary bg-primary/10"
                        : "text-text-muted hover:text-primary hover:bg-primary/5"
                    }`}
                    title="Documents"
                  >
                    <DocumentTextIcon className="h-6 w-6" />
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
                    className="h-10 w-10 flex items-center justify-center rounded-lg text-text-muted hover:text-primary hover:bg-primary/5 transition-all duration-200"
                    title="Admin"
                  >
                    <ShieldCheckIcon className="h-6 w-6" />
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="h-6 w-px bg-border mx-2 hidden md:block"></div>

          {/* Language Switcher */}
          <div
            className="hidden md:block mr-2 flex-shrink-0"
            ref={(el) => {
              dropdownRefs.current.language = el;
            }}
          >
            <LanguageSwitcher
              isOpen={openDropdown === "language"}
              onToggle={() => toggleDropdown("language")}
            />
          </div>

          {/* Theme Toggle */}
          <ThemeToggleButton />

          {/* Auth / User Menu */}
          <div
            className="ml-2"
            ref={(el) => {
              dropdownRefs.current.user = el;
            }}
          >
            {isLoggedIn ? (
              <UserMenu
                isOpen={openDropdown === "user"}
                onToggle={() => toggleDropdown("user")}
              />
            ) : (
              <AuthButtons />
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden ml-2">
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
