import React, { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "hi", name: "हिंदी", flag: "🇮🇳" },
];

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const currentLanguage =
    languages.find((l) => l.code === i18n.language) || languages[0];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex items-center justify-center p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/5 transition-all duration-200 focus:outline-none">
          <span className="text-sm font-medium uppercase">
            {currentLanguage.code}
          </span>
          <ChevronDownIcon className="w-3 h-3 ml-1 opacity-70" />
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95 -translate-y-2"
        enterTo="transform opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100 translate-y-0"
        leaveTo="transform opacity-0 scale-95 -translate-y-2"
      >
        <Menu.Items
          className="absolute right-0 mt-2 w-40 origin-top-right bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50 dark:bg-gray-900/80 focus:outline-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
          }}
        >
          <div className="p-1">
            {languages.map((language) => (
              <Menu.Item key={language.code}>
                {({ active }) => (
                  <button
                    onClick={() => changeLanguage(language.code)}
                    className={`${
                      active
                        ? "bg-white/10 dark:bg-gray-700/50 text-primary dark:text-white"
                        : "text-text-base dark:text-white/90"
                    } group flex rounded-lg items-center w-full px-3 py-2 text-sm transition-all duration-200`}
                  >
                    <span className="mr-3 text-lg">{language.flag}</span>
                    <span className="font-medium">{language.name}</span>
                    {currentLanguage.code === language.code && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default LanguageSwitcher;
