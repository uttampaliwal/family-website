import React, { useState, useEffect, useRef, useMemo } from "react";

// --- Type Definitions ---
interface NavItem {
  label: string;
  href?: string;
  onClick?: () => void;
  isExternal?: boolean;
}

interface GlossyNavProps {
  navItems: NavItem[];
  authItems: NavItem[];
  ariaLabel?: string;
}

// --- Sub-Components ---
const NavItemComponent: React.FC<{ item: NavItem; onClick: () => void }> = ({
  item,
  onClick,
}) => {
  const commonProps = {
    className: "glossy-nav-item",
    onClick,
    role: "menuitem",
  };

  if (item.href) {
    return (
      <a
        href={item.href}
        {...commonProps}
        target={item.isExternal ? "_blank" : undefined}
        rel={item.isExternal ? "noopener noreferrer" : undefined}
      >
        {item.label}
      </a>
    );
  }

  if (item.onClick) {
    return <button {...commonProps}>{item.label}</button>;
  }

  return null;
};

// --- Main Component ---
const GlossyNav: React.FC<GlossyNavProps> = ({
  navItems = [],
  authItems = [],
  ariaLabel = "Main navigation",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const totalItems = navItems.length + authItems.length;

  // --- Keyboard & Focus Logic ---
  useEffect(() => {
    if (!isOpen) return;

    const menuElement = menuRef.current;
    if (!menuElement) return;

    const focusableElements = Array.from(
      menuElement.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>(
        "a[href], button:not([disabled])",
      ),
    );
    if (focusableElements.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key } = event;
      const activeElement = document.activeElement;

      if (key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }

      const currentIndex = focusableElements.findIndex(
        (el) => el === activeElement,
      );

      if (key === "ArrowDown") {
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % focusableElements.length;
        focusableElements[nextIndex].focus();
      } else if (key === "ArrowUp") {
        event.preventDefault();
        const prevIndex =
          (currentIndex - 1 + focusableElements.length) %
          focusableElements.length;
        focusableElements[prevIndex].focus();
      } else if (key === "Home") {
        event.preventDefault();
        focusableElements[0].focus();
      } else if (key === "End") {
        event.preventDefault();
        focusableElements[focusableElements.length - 1].focus();
      } else if (key === "Tab") {
        // Trap focus
        event.preventDefault();
        const nextIndex =
          (currentIndex +
            (event.shiftKey ? -1 : 1) +
            focusableElements.length) %
          focusableElements.length;
        focusableElements[nextIndex].focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Announce content and focus first item
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = `Menu opened with ${totalItems} items.`;
    }
    focusableElements[0]?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, totalItems]);

  // --- Dynamic Column Calculation ---
  const columnClass = useMemo(() => {
    const count = navItems.length;
    if (count <= 3) return "columns-1";
    if (count <= 7) return "columns-2";
    return "columns-3";
  }, [navItems.length]);

  const handleItemClick = (itemAction?: () => void) => {
    if (itemAction) {
      itemAction();
    }
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="glossy-nav-container">
      <button
        ref={triggerRef}
        className="glossy-nav-trigger"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls="glossy-menu"
        aria-label={ariaLabel}
        onClick={() => setIsOpen(!isOpen)}
      >
        Menu
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d={isOpen ? "M15 5L5 15" : "M3.75 5.75H16.25"} />
          <path d={isOpen ? "M5 5L15 15" : "M3.75 9.75H16.25"} />
          <path d={!isOpen ? "M3.75 13.75H16.25" : ""} />
        </svg>
      </button>

      <div
        id="glossy-menu"
        ref={menuRef}
        className={`glossy-nav-menu ${!isOpen ? "closed" : ""}`}
        role="menu"
        aria-label={ariaLabel}
        hidden={!isOpen}
      >
        <div className={`nav-grid ${columnClass}`}>
          {navItems.map((item) => (
            <NavItemComponent
              item={item}
              key={item.label}
              onClick={() => handleItemClick(item.onClick)}
            />
          ))}
        </div>

        {authItems.length > 0 && (
          <>
            <hr className="glossy-nav-separator" />
            <div className="glossy-nav-auth-group">
              {authItems.map((item) => (
                <NavItemComponent
                  item={item}
                  key={item.label}
                  onClick={() => handleItemClick(item.onClick)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div
        ref={liveRegionRef}
        className="visually-hidden"
        aria-live="polite"
        aria-atomic="true"
      ></div>
    </div>
  );
};

export default GlossyNav;
