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
  children?: React.ReactNode; // For embedding other components like ThemeToggleButton
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
  children,
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
    <>
      <style>{`
        :root {
          --nav-bg-light: rgba(255, 255, 255, 0.2);
          --nav-border-light: rgba(255, 255, 255, 0.3);
          --nav-text-light: #1a1a1a;
          --nav-hover-bg-light: rgba(255, 255, 255, 0.5);
          --nav-focus-ring-light: #005fcc;

          --nav-bg-dark: rgba(20, 20, 20, 0.2);
          --nav-border-dark: rgba(255, 255, 255, 0.2);
          --nav-text-dark: #f0f0f0;
          --nav-hover-bg-dark: rgba(50, 50, 50, 0.6);
          --nav-focus-ring-dark: #6ab0ff;
          
          --nav-bg: var(--nav-bg-light);
          --nav-border: var(--nav-border-light);
          --nav-text: var(--nav-text-light);
          --nav-hover-bg: var(--nav-hover-bg-light);
          --nav-focus-ring: var(--nav-focus-ring-light);
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --nav-bg: var(--nav-bg-dark);
            --nav-border: var(--nav-border-dark);
            --nav-text: var(--nav-text-dark);
            --nav-hover-bg: var(--nav-hover-bg-dark);
            --nav-focus-ring: var(--nav-focus-ring-dark);
          }
        }

        .glossy-nav-container {
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .glossy-nav-trigger {
          background-color: var(--nav-bg);
          border: 1px solid var(--nav-border);
          color: var(--nav-text);
          border-radius: 9999px;
          padding: 10px 20px;
          cursor: pointer;
          min-height: 44px;
          min-width: 44px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .glossy-nav-trigger:focus-visible {
          outline: 2px solid var(--nav-focus-ring);
          outline-offset: 2px;
        }

        .glossy-nav-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          z-index: 50;
          border-radius: 60px;
          background-color: var(--nav-bg);
          border: 1px solid var(--nav-border);
          padding: 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          width: max-content;
          max-width: 90vw;
          
          /* Glassmorphism */
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
          
          /* Animation */
          transform-origin: top right;
          transition: transform 0.2s ease-out, opacity 0.2s ease-out;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .glossy-nav-menu {
            transition: opacity 0.2s ease-out;
          }
          .glossy-nav-menu.closed {
             transform: none !important;
          }
        }
        
        .glossy-nav-menu.closed {
          opacity: 0;
          transform: scale(0.95) translateY(-10px);
          pointer-events: none;
        }
        
        .glossy-nav-menu .nav-grid {
          display: grid;
          gap: 12px;
        }

        .glossy-nav-menu .nav-grid.columns-1 { grid-template-columns: repeat(1, 1fr); }
        .glossy-nav-menu .nav-grid.columns-2 { grid-template-columns: repeat(2, 1fr); }
        .glossy-nav-menu .nav-grid.columns-3 { grid-template-columns: repeat(3, 1fr); }

        .glossy-nav-item {
          color: var(--nav-text);
          text-decoration: none;
          padding: 10px 16px;
          border-radius: 12px;
          min-height: 44px; /* WCAG Touch Target */
          display: flex;
          align-items: center;
          transition: background-color 0.15s ease-in-out;
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
          font-size: inherit;
        }

        .glossy-nav-item:hover,
        .glossy-nav-item:focus-visible {
          background-color: var(--nav-hover-bg);
        }
        
        .glossy-nav-item:focus-visible {
           outline: 2px solid var(--nav-focus-ring);
           outline-offset: 2px;
        }

        .glossy-nav-separator {
          border-bottom: 1px solid var(--nav-border);
          margin: 16px 0;
        }
        
        .glossy-nav-auth-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .glossy-nav-children-container {
            padding-top: 16px;
        }
        
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
        
        /* High Contrast Fallback */
        @media (prefers-contrast: more) {
          .glossy-nav-menu, .glossy-nav-trigger {
            -webkit-backdrop-filter: none;
            backdrop-filter: none;
            background-color: Canvas; /* System background */
            color: CanvasText; /* System text */
          }
           .glossy-nav-item {
             color: CanvasText;
           }
           .glossy-nav-item:hover,
           .glossy-nav-item:focus-visible {
             background-color: Highlight;
             color: HighlightText;
           }
           .glossy-nav-separator {
             border-color: CanvasText;
           }
        }
      `}</style>
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

          {children && (
            <>
              <hr className="glossy-nav-separator" />
              <div className="glossy-nav-children-container">{children}</div>
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
    </>
  );
};

export default GlossyNav;
