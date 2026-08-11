import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translations, type Language } from "./translations.js";

const STORAGE_KEY = "kulaya.lang";

type Dictionary = typeof translations.en;

type I18nContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof Dictionary, vars?: Record<string, string>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function initialLang(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "hi") return stored;
  return navigator.language.toLowerCase().startsWith("hi") ? "hi" : "en";
}

function interpolate(
  template: string,
  vars?: Record<string, string>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? (vars[name] ?? match) : match,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(initialLang);
  // The default language is bundled; Hindi is fetched on demand so the
  // landing page never downloads a dictionary it doesn't render.
  const [dict, setDict] = useState<Dictionary>(translations.en);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (lang === "en") {
      setDict(translations.en);
      return;
    }
    let stale = false;
    void import("./translations-hi.js")
      .then((module) => {
        if (!stale) setDict(module.hi);
      })
      .catch(() => {
        if (!stale) setDict(translations.en);
      });
    return () => {
      stale = true;
    };
  }, [lang]);

  const setLang = useCallback((next: Language) => setLangState(next), []);

  const value = useMemo<I18nContextValue>(() => {
    return {
      lang,
      setLang,
      t: (key, vars) =>
        interpolate(dict[key] ?? translations.en[key] ?? key, vars),
    };
  }, [lang, setLang, dict]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}