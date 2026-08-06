import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ColorMode, ThemeId } from "@family/core";

const STORAGE_KEY = "family-portal.theme";
const THEMES: ThemeId[] = ["warm", "minimal", "playful"];
const MODES: ColorMode[] = ["light", "dark"];

interface ThemeContextValue {
  theme: ThemeId;
  mode: ColorMode;
  setTheme: (theme: ThemeId) => void;
  setMode: (mode: ColorMode) => void;
  toggleMode: () => void;
  /** Persisted "next" mode used by the toggle before hydration resolves */
  resolvedMode: ColorMode;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredValue(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readInitial(): { theme: ThemeId; mode: ColorMode } {
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    const attrTheme = root.dataset.theme as ThemeId | undefined;
    const attrMode = root.dataset.mode as ColorMode | undefined;
    if (attrTheme && THEMES.includes(attrTheme)) {
      return {
        theme: attrTheme,
        mode: attrMode && MODES.includes(attrMode) ? attrMode : "light",
      };
    }
  }
  const stored = readStoredValue(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Partial<{ theme: ThemeId; mode: ColorMode }>;
      return {
        theme: THEMES.includes(parsed.theme as ThemeId) ? (parsed.theme as ThemeId) : "warm",
        mode: MODES.includes(parsed.mode as ColorMode) ? (parsed.mode as ColorMode) : "light",
      };
    } catch {
      // ignore corrupt storage
    }
  }
  return { theme: "warm", mode: "light" };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(readInitial, []);
  const [theme, setThemeState] = useState<ThemeId>(initial.theme);
  const [mode, setModeState] = useState<ColorMode>(initial.mode);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.mode = mode;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme, mode }));
    } catch {
      // storage unavailable — theme still applies for the session
    }
  }, [theme, mode]);

  const setTheme = useCallback((next: ThemeId) => setThemeState(next), []);
  const setMode = useCallback((next: ColorMode) => setModeState(next), []);
  const toggleMode = useCallback(
    () => setModeState((m) => (m === "light" ? "dark" : "light")),
    [],
  );

  const value = useMemo(
    () => ({ theme, mode, setTheme, setMode, toggleMode, resolvedMode: mode }),
    [theme, mode, setTheme, setMode, toggleMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

/**
 * Inline script injected into <head> — applies the saved theme before
 * React hydrates, preventing a flash of the wrong theme (FOUC).
 */
export const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem("${STORAGE_KEY}");
    var t = "warm", m = "light";
    if (stored) {
      var p = JSON.parse(stored);
      if (p.theme) t = p.theme;
      if (p.mode) m = p.mode;
    }
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.setAttribute("data-mode", m);
  } catch (e) {}
})();
`;
