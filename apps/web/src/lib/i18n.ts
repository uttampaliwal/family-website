import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

i18n
  // Load translations using HTTP backend
  .use(HttpBackend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    fallbackLng: "en",
    debug: import.meta.env.DEV,

    // Default namespace
    defaultNS: "common",

    // Namespaces to load initially
    ns: ["common", "home", "footer"],

    interpolation: {
      escapeValue: false, // React already escapes by default
    },

    // Supported languages
    supportedLngs: ["en", "hi"],

    // Backend configuration for loading translations
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },

    // React-specific options
    react: {
      useSuspense: true, // Use React Suspense for loading translations
    },
  });

export default i18n;
