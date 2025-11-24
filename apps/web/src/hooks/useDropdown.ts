/**
 * 🎯 useDropdown Hook
 *
 * Shared dropdown/menu functionality with:
 * - Click outside to close
 * - Escape key to close
 * - Ref management for dropdown container
 *
 * @example
 * ```tsx
 * const { isOpen, toggle, close, open, dropdownRef } = useDropdown();
 *
 * return (
 *   <div ref={dropdownRef}>
 *     <button onClick={toggle}>Toggle Menu</button>
 *     {isOpen && <div>Menu content</div>}
 *   </div>
 * );
 * ```
 */

import { useState, useEffect, useRef, useCallback } from "react";

export interface UseDropdownReturn {
  /** Whether the dropdown is currently open */
  isOpen: boolean;
  /** Toggle the dropdown open/closed */
  toggle: () => void;
  /** Close the dropdown */
  close: () => void;
  /** Open the dropdown */
  open: () => void;
  /** Ref to attach to the dropdown container */
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Hook for managing dropdown/menu state with keyboard and click-outside support
 */
export function useDropdown(): UseDropdownReturn {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Add listener when dropdown is open
      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  return {
    isOpen,
    toggle,
    close,
    open,
    dropdownRef,
  };
}

export default useDropdown;
