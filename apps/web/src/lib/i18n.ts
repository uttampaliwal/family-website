import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// English Translations
const resources = {
  en: {
    translation: {
      app: {
        title: "Yuva Kulya",
        subtitle: "The Official Family Portal",
      },
      nav: {
        home: "Home",
        tree: "Family Tree",
        gallery: "Gallery",
        chat: "Chat",
        documents: "Documents",
        login: "Login",
        profile: "Profile",
      },
      home: {
        welcome: "Welcome to <1>Yuva Kulya</1>",
        tagline: "Your secure family hub for generations to come.",
        quickActions: "Family Hub",
        recentActivity: "Recent Activity",
        familyTools: "Family Tools",
        viewAll: "View All",
        searchPlaceholder: "Search family, documents, events...",
        customizeTools: "Customize Tools",
        importantUpdates: "Important Updates",
        localWeather: "Local Weather",
        familyCalendar: "Family Calendar",
      },
      header: {
        features: "Features",
        family: "Family",
        documents: "Documents",
        admin: "Admin",
      },
      welcome: {
        goodMorning: "Good Morning",
        goodAfternoon: "Good Afternoon",
        goodEvening: "Good Evening",
        member: "Family Member",
        subtitle: "Welcome to your family's digital sanctuary.",
      },
      announcements: {
        label: "FAMILY ANNOUNCEMENTS",
      },
      actions: {
        familyTree: "Family Tree",
        familyChat: "Family Chat",
        photoGallery: "Photo Gallery",
        documents: "Documents",
      },
      auth: {
        signIn: "Sign In",
        register: "Register",
        signOut: "Sign Out",
        welcomeBack: "Welcome Back",
      },
      theme: {
        light: "Light",
        dark: "Dark",
      },
      footer: {
        tagline:
          "A digital sanctuary where our family bonds flourish, memories are preserved, and love transcends distance.",
        quickLinks: "Quick Links",
        contactUs: "Contact Us",
        stayConnected: "Stay Connected",
        newsletterText: "Subscribe to our newsletter for family updates.",
        subscribe: "Subscribe",
        copyright: "Made with ❤️ for our family.",
        portalActive: "Family Portal Active",
      },
      announcementContent: {
        birthday:
          "🎉 Happy Birthday to Priya! Join us for the virtual celebration at 7 PM today!",
        videoCall:
          "📅 Family video call scheduled for this Sunday at 6 PM. Don't forget to join!",
        newPhotos:
          "📸 New family photos have been uploaded to the gallery. Check them out!",
        welcome:
          "🌟 Welcome to our new family portal! Explore all the amazing features we've built together.",
        anniversary:
          "💑 Congratulations to Raj and Meera on their 5th anniversary! Wishing you many more years of happiness!",
      },
      activity: {
        addedEvent: "Added new event",
        sharedPhoto: "Shared family photo",
        completedTask: "Completed task",
        hourAgo: "1 hour ago",
        hoursAgo: "2 hours ago",
        hoursAgo3: "3 hours ago",
      },
    },
  },
  hi: {
    translation: {
      app: {
        title: "युवा कुल्या",
        subtitle: "आधिकारिक परिवार पोर्टल",
      },
      nav: {
        home: "होम",
        tree: "वंशावली",
        gallery: "गैलरी",
        chat: "चैट",
        documents: "दस्तावेज़",
        login: "लॉग इन",
        profile: "प्रोफाइल",
      },
      home: {
        welcome: "<1>युवा कुल्या</1> में आपका स्वागत है",
        tagline: "आने वाली पीढ़ियों के लिए आपका सुरक्षित पारिवारिक केंद्र।",
        quickActions: "फैमिली हब",
        recentActivity: "हाल की गतिविधियां",
        familyTools: "पारिवारिक उपकरण",
        viewAll: "सभी देखें",
        searchPlaceholder: "परिवार, दस्तावेज़, कार्यक्रम खोजें...",
        customizeTools: "उपकरण अनुकूलित करें",
        importantUpdates: "महत्वपूर्ण अपडेट",
        localWeather: "स्थानीय मौसम",
        familyCalendar: "पारिवारिक कैलेंडर",
      },
      header: {
        features: "सुविधाएँ",
        family: "परिवार",
        documents: "दस्तावेज़",
        admin: "व्यवस्थापक",
      },
      welcome: {
        goodMorning: "सुप्रभात",
        goodAfternoon: "नमस्कार",
        goodEvening: "शुभ संध्या",
        member: "परिवार के सदस्य",
        subtitle: "आपके परिवार के डिजिटल अभयारण्य में आपका स्वागत है।",
      },
      announcements: {
        label: "पारिवारिक घोषणाएं",
      },
      actions: {
        familyTree: "वंशावली",
        familyChat: "पारिवारिक चैट",
        photoGallery: "फोटो गैलरी",
        documents: "दस्तावेज़",
      },
      auth: {
        signIn: "साइन इन करें",
        register: "रजिस्टर करें",
        signOut: "साइन आउट करें",
        welcomeBack: "वापसी पर स्वागत है",
      },
      theme: {
        light: "लाइट",
        dark: "डार्क",
      },
      footer: {
        tagline:
          "एक डिजिटल अभयारण्य जहाँ हमारे पारिवारिक बंधन फलते-फूलते हैं, यादें संरक्षित होती हैं, और प्यार दूरी से परे होता है।",
        quickLinks: "त्वरित लिंक",
        contactUs: "संपर्क करें",
        stayConnected: "जुड़े रहें",
        newsletterText:
          "पारिवारिक अपडेट के लिए हमारे न्यूज़लेटर की सदस्यता लें।",
        subscribe: "सदस्यता लें",
        copyright: "हमारे परिवार के लिए ❤️ के साथ बनाया गया।",
        portalActive: "परिवार पोर्टल सक्रिय",
      },
      announcementContent: {
        birthday:
          "🎉 प्रिया को जन्मदिन की शुभकामनाएँ! आज शाम 7 बजे वर्चुअल उत्सव में शामिल हों!",
        videoCall:
          "📅 इस रविवार शाम 6 बजे परिवार की वीडियो कॉल शेड्यूल है। शामिल होना न भूलें!",
        newPhotos:
          "📸 नई पारिवारिक तस्वीरें गैलरी में अपलोड की गई हैं। उन्हें देखें!",
        welcome:
          "🌟 हमारे नए पारिवारिक पोर्टल में आपका स्वागत है! हमने मिलकर बनाई गई सभी अद्भुत सुविधाओं का अन्वेषण करें।",
        anniversary:
          "💑 राज और मीरा को उनकी 5वीं वर्षगांठ पर बधाई! आपको खुशियों के कई और वर्षों की शुभकामनाएं!",
      },
      activity: {
        addedEvent: "नया कार्यक्रम जोड़ा गया",
        sharedPhoto: "पारिवारिक फोटो साझा की गई",
        completedTask: "कार्य पूरा किया",
        hourAgo: "1 घंटे पहले",
        hoursAgo: "2 घंटे पहले",
        hoursAgo3: "3 घंटे पहले",
      },
    },
  },
};

i18n
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    resources,
    fallbackLng: "en",
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },

    // Common languages for a family website
    supportedLngs: ["en", "hi"],
  });

export default i18n;
