import { useState, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

const ThemeToggleButton = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
          return savedTheme;
        }
      } catch {
        // localStorage might not be available in incognito mode
        console.log("localStorage not available, using system preference");
      }

      // Fallback to system preference
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    }
    return "light";
  });

  const [isIncognito, setIsIncognito] = useState(false);

  useEffect(() => {
    // Apply theme to document
    const root = window.document.documentElement;

    // Remove any existing theme classes
    root.classList.remove("dark", "light");

    // Add the current theme class
    root.classList.add(theme);

    // Try to save to localStorage and detect incognito mode
    try {
      localStorage.setItem("theme", theme);
      setIsIncognito(false);
    } catch {
      setIsIncognito(true);
    }
  }, [theme]);

  // Listen for system theme changes in incognito mode
  useEffect(() => {
    if (!isIncognito) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [isIncognito]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className="flex items-center gap-2">
      {isIncognito && (
        <span className="text-xs text-muted-foreground hidden sm:block">
          Incognito mode
        </span>
      )}
      <button
        onClick={toggleTheme}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface/50 hover:bg-surface/80 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 border border-border/50"
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        title={`Current theme: ${theme}${isIncognito ? " (incognito mode - won't persist)" : ""}`}
      >
        {theme === "light" ? (
          <Sun className="h-5 w-5 text-primary" />
        ) : (
          <Moon className="h-5 w-5 text-primary" />
        )}
        <span className="text-sm font-medium hidden sm:block">
          {theme === "light" ? "Light" : "Dark"}
        </span>
        {isIncognito && <Monitor className="h-4 w-4 text-muted-foreground" />}
      </button>
    </div>
  );
};

export default ThemeToggleButton;
