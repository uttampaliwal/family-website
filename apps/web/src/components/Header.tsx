import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import HamburgerMenu from "./HamburgerMenu";
import ThemeToggleButton from "./ThemeToggleButton";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import GlossyNav from "./GlossyNav"; // Import the new component

interface HeaderProps {
  // No props needed
}

const navigationConfig = {
  public: {
    features: {
      label: "Features",
      items: [
        { to: "/features/family-tree", label: "Family Tree" },
        { to: "/features/chat", label: "Family Chat" },
        { to: "/features/documents", label: "Document Sharing" },
        { to: "/features/photos", label: "Photo Gallery" },
      ],
    },
  },
  family: {
    label: "Family",
    items: [
      { to: "/family-tree", label: "Family Tree" },
      { to: "/chat", label: "Family Chat" },
      { to: "/social-ultimate", label: "Social Feed" },
      { to: "/family-photos", label: "Photos" },
      { to: "/family-calendar", label: "Calendar" },
    ],
  },
  documents: {
    label: "Documents",
    items: [
      { to: "/documents", label: "All Documents" },
      { to: "/documents/shared", label: "Shared" },
      { to: "/documents/recent", label: "Recent" },
    ],
  },
};

const HEADER_HEIGHT = 96; // Corresponds to h-16 (64px) + mt-4 (16px) * 2 for top/bottom space approx.

const Header = (props: HeaderProps) => {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // --- State for Intelligent Hiding ---
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // --- Logic for hiding header on scroll ---
  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > HEADER_HEIGHT) {
        setVisible(false); // Scrolling down
      } else {
        setVisible(true); // Scrolling up or at top
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", controlNavbar);
    return () => {
      window.removeEventListener("scroll", controlNavbar);
    };
  }, [lastScrollY]);

  // Logic for independent dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const isClickInside = Object.values(dropdownRefs.current).some((ref) =>
          ref?.contains(event.target as Node),
        );
        if (!isClickInside) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/documents?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  // Consolidate Nav Items for GlossyNav
  const navItems: { label: string; href: string }[] = [];
  const authItems: { label: string; href?: string; onClick?: () => void }[] =
    [];

  if (isLoggedIn && user) {
    navItems.push(
      ...navigationConfig.family.items.map((i) => ({ ...i, href: i.to })),
    );
    navItems.push(
      ...navigationConfig.documents.items.map((i) => ({ ...i, href: i.to })),
    );
    if (user.role === "admin") {
      navItems.push({ to: "/admin", label: "Admin", href: "/admin" });
    }

    authItems.push({
      label: "Profile",
      href: `/profile/${encodeURIComponent(user.username)}`,
    });
    authItems.push({ label: "Settings", href: "/settings" });
    authItems.push({ label: "Sign Out", onClick: () => logout() });
  } else {
    navItems.push(
      ...navigationConfig.public.features.items.map((i) => ({
        ...i,
        href: i.to,
      })),
    );
  }

  return (
    <header
      role="banner"
      className={`fixed top-0 left-0 w-full z-50 transition-transform duration-300 ease-in-out ${!visible ? "-translate-y-full" : ""}`}
    >
      <div className="relative container mx-auto mt-4">
        <div className="h-16 px-6 flex items-center justify-between rounded-full bg-surface/95 backdrop-blur-md shadow-lg border border-border/20">
          {/* Logo Section */}
          <div className="flex items-center w-[250px] shrink-0">
            <Link to="/" className="flex items-center group gap-3">
              <div className="relative flex items-center justify-center bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-all duration-300 w-10 h-10">
                <Logo className="text-primary transition-all duration-300 w-6 h-6" />
              </div>
              <div className="hidden sm:flex flex-col w-[180px]">
                <span className="text-xl font-bold text-text-base leading-tight tracking-tight">
                  {t("app.title")}
                </span>
                <span className="text-xs text-text-muted font-medium tracking-wide">
                  {t("app.subtitle")}
                </span>
              </div>
            </Link>
          </div>

          {/* Center Search */}
          <div className="flex-1 flex items-center justify-center px-8">
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
          <div className="flex items-center gap-4 justify-end shrink-0 min-w-[250px]">
            <div className="hidden md:flex items-center gap-2">
              <GlossyNav navItems={navItems} authItems={authItems} />

              {!isLoggedIn && (
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium rounded-full shadow-md bg-primary text-white border border-solid border-gray-400 dark:border-gray-600 hover:bg-primary/90 transition-colors"
                >
                  Sign In
                </Link>
              )}

              <div className="h-6 w-px bg-border/50"></div>

              <div
                ref={(el) => {
                  dropdownRefs.current.language = el;
                }}
              >
                <LanguageSwitcher
                  isOpen={openDropdown === "language"}
                  onToggle={() => toggleDropdown("language")}
                />
              </div>
              <ThemeToggleButton />
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
      </div>
    </header>
  );
};

export default Header;
