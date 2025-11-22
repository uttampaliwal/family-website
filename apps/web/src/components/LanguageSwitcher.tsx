import React, { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "hi", name: "हिंदी", flag: "🇮🇳" },
];

interface LanguageSwitcherProps {
  isOpen: boolean;
  onToggle: () => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  isOpen,
  onToggle,
}) => {
  const { i18n } = useTranslation();

  const currentLanguage =
    languages.find((l) => l.code === i18n.language) || languages[0];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    onToggle(); // Close on selection
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={onToggle}
        className={`inline-flex items-center justify-center w-16 p-2 rounded-lg transition-all duration-200 focus:outline-none ${
          isOpen
            ? "text-primary bg-primary/10"
            : "text-text-muted hover:text-primary hover:bg-primary/5"
        }`}
      >
        <span className="text-sm font-medium uppercase">
          {currentLanguage.code}
        </span>
        <ChevronDownIcon
          className={`w-3 h-3 ml-1 opacity-70 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <Transition
        show={isOpen}
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95 -translate-y-2"
        enterTo="transform opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100 translate-y-0"
        leaveTo="transform opacity-0 scale-95 -translate-y-2"
      >
        <div className="absolute right-0 mt-2 w-40 origin-top-right bg-surface/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden z-50 focus:outline-none">
          <div className="p-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`${
                  currentLanguage.code === language.code
                    ? "bg-primary/10 text-primary"
                    : "text-text-base hover:bg-primary/5"
                } group flex rounded-lg items-center w-full px-3 py-2 text-sm transition-all duration-200`}
              >
                <span className="mr-3 text-lg">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
                {currentLanguage.code === language.code && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default LanguageSwitcher;
