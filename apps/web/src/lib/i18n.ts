import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files directly
import commonEn from "../../public/locales/en/common.json";
import commonHi from "../../public/locales/hi/common.json";
import homeEn from "../../public/locales/en/home.json";
import homeHi from "../../public/locales/hi/home.json";
import footerEn from "../../public/locales/en/footer.json";
import footerHi from "../../public/locales/hi/footer.json";

const resources = {
  en: {
    common: commonEn,
    home: homeEn,
    footer: footerEn,
  },
  hi: {
    common: commonHi,
    home: homeHi,
    footer: footerHi,
  },
};

// Debug logging
if (import.meta.env.DEV) {
  console.log("i18n resources loaded:", {
    en: Object.keys(resources.en),
    hi: Object.keys(resources.hi),
    homeKeys: Object.keys(resources.en.home),
  });
}

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: "en",
    debug: import.meta.env.DEV,

    // Default namespace
    defaultNS: "common",

    // Namespaces
    ns: ["common", "home", "footer"],

    interpolation: {
      escapeValue: false, // React already escapes by default
    },

    // Supported languages
    supportedLngs: ["en", "hi"],
  });

export default i18n;
