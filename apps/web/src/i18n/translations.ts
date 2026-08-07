export type Language = "en" | "hi";

export const translations = {
  en: {
    // Brand
    "brand.name": "Kulaya",
    "brand.tagline": "the family nest",
    "brand.homeAria": "Kulaya home",

    // Nav
    "nav.home": "Home",
    "nav.members": "Members",
    "nav.photos": "Photos",
    "nav.events": "Events",
    "nav.announcements": "Announcements",
    "nav.documents": "Documents",
    "nav.moments": "Moments",
    "nav.chat": "Chat",
    "nav.mainAria": "Main navigation",

    // Global search
    "search.open": "Search the family",
    "search.label": "Search",
    "search.placeholder": "People, photos, moments, events, docs, chat…",
    "search.hint": "Type at least 2 letters — everything in the nest is searchable",
    "search.title": "Search",
    "search.noResults": "Nothing found for “{q}”",
    "search.group.people": "People",
    "search.group.photos": "Photos",
    "search.group.posts": "Moments",
    "search.group.events": "Events",
    "search.group.documents": "Documents",
    "search.group.messages": "Messages",

    // Roles
    "role.owner": "Owner",
    "role.admin": "Admin",
    "role.parent": "Parent",
    "role.adult": "Adult",
    "role.teen": "Teen",
    "role.child": "Child",
    "role.guest": "Guest",
    "role.choose": "Role on approval",

    // Account dropdown
    "account.openMenu": "Open account menu",
    "account.family": "Family hub",
    "account.profile": "My profile",
    "account.approvals": "Approval queue",
    "account.signOut": "Sign out",

    // Notifications
    "notify.open": "Open notifications",
    "notify.title": "Notifications",
    "notify.empty": "Nothing yet — we'll let you know when something happens.",
    "notify.markAllRead": "Mark all read",
    "notify.unread": "{count} unread",
    "notify.type.announcement": "New announcement",
    "notify.type.event": "New event",
    "notify.type.moment_like": "{name} liked your moment",
    "notify.type.moment_comment": "{name} commented on your moment",
    "notify.type.member_joined": "{name} requested to join",
    "notify.type.approval": "Your account is approved — welcome to the family",

    // Language switcher
    "lang.switchTo": "Switch language",
    "lang.label": "भाषा: हिन्दी",

    // Auth toggle (hero CTA when signed out)
    "auth.cta.join": "Join the family",
    "auth.cta.welcome": "Welcome back, {name}!",
    "auth.tryMode": "Try {mode} mode",

    // Footer
    "footer.builtWith": "Built with care for our family",
    "footer.health": "Health",
    "footer.privacy": "Privacy",
    "footer.terms": "Terms",
    "footer.contact": "Contact",
    "footer.navAria": "Footer",

    // Legal
    "legal.backToHome": "Back to home",
    "legal.privacy.title": "Privacy Policy",
    "legal.privacy.subtitle": "How we protect and handle family information.",
    "legal.terms.title": "Terms of Use",
    "legal.terms.subtitle": "The simple rules that keep our family space healthy.",
    "legal.contact.title": "Contact Us",
    "legal.contact.subtitle": "Family first — reach out any time.",
    "legal.contact.response": "We aim to respond within 48 hours.",
    "legal.contact.name": "Your name",
    "legal.contact.email": "Your email",
    "legal.contact.subject": "Subject",
    "legal.contact.message": "Message",
    "legal.contact.send": "Send via email",
    "legal.contact.mailtoNote": "This opens your email app with the message pre-filled — nothing is stored or sent on our servers.",

    // Home
    "home.badge": "Kulaya — our family nest is coming home",
    "home.h1": "Where our family stays",
    "home.h1.accent": " close",
    "home.h1.suffix": ", no matter the miles",
    "home.hero":
      "Kulaya — कुल + आलय, the family nest. A private home for photos, events, documents, and the moments in between — built for every generation, in every mood.",
    "home.currentlyOn": "Currently on the “{theme}” theme · {mode} mode",
    "home.themesTitle": "Made for every generation",
    "home.themesSub": "Three themes, light and dark — choose what feels like home.",
    "home.previewDark": "Preview dark mode",
    "home.featuresTitle": "Everything a family needs",
    "home.featuresSub": "Arriving step by step, built on solid ground.",
    "home.preview": "Preview",
    "home.active": "Active",
    "home.feature.photos": "Photo Albums",
    "home.feature.photos.desc":
      "Preserve every celebration — share albums with the whole family.",
    "home.feature.events": "Events & RSVP",
    "home.feature.events.desc":
      "Birthdays, weddings, and get-togethers, all in one calendar.",
    "home.feature.documents": "Documents",
    "home.feature.documents.desc":
      "Important papers kept safe, privately, and always within reach.",
    "home.feature.tree": "Family Tree",
    "home.feature.tree.desc":
      "Watch the branches of our family grow through generations.",
    "home.feature.moments": "Moments",
    "home.feature.moments.desc":
      "A private feed where every day can be shared with everyone.",
    "home.feature.announcements": "Announcements",
    "home.feature.announcements.desc":
      "One trusted place for news that matters to the whole family.",

    // Login
    "login.title": "Welcome back",
    "login.description": "Sign in to step into the family nest.",

    // Dashboard (members)
    "dash.goodMorning": "Good morning",
    "dash.goodAfternoon": "Good afternoon",
    "dash.goodEvening": "Good evening",
    "dash.welcomeName": ", {name}",
    "dash.quickActions": "Quick actions",
    "dash.updates": "Around the nest",
    "dash.latestAnnouncement": "Latest announcement",
    "dash.nextEvent": "Next event",
    "dash.noEvents": "Nothing scheduled — enjoy the open day.",
    "dash.noAnnouncements": "No announcements yet.",
    "dash.viewAll": "View all",
    "login.email": "Email or username",
    "login.password": "Password",
    "login.emailPlaceholder": "you@example.com",
    "login.submit": "Sign in",
    "login.forgot": "Forgot password?",
    "login.noAccount": "New to the family?",
    "login.createAccount": "Create an account",
    "login.error.invalid": "That email or password didn't match. Please try again.",
    "login.error.notVerified":
      "Your email isn't verified yet — check your inbox for the verification link.",
    "login.error.pending":
      "Your account is awaiting approval by an administrator. Please check back soon.",
    "login.error.rejected": "Access was not granted to this account.",
    "login.error.rateLimited":
      "Too many attempts — please wait a minute and try again.",
    "login.error.generic": "Something went wrong. Please try again.",
    "login.success": "Welcome back",

    // Register
    "register.title": "Join the family",
    "register.description":
      "Create your account — a family member needs to approve it before you're in.",
    "register.name": "Full name",
    "register.namePlaceholder": "Aarav Sharma",
    "register.email": "Email",
    "register.username": "Username",
    "register.usernameHint": "3–30 characters, letters, numbers, underscores",
    "register.password": "Password",
    "register.submit": "Create account",
    "register.already": "Already family?",
    "register.signIn": "Sign in",
    "register.availability.checking": "Checking availability…",
    "register.availability.available": "Username is available",
    "register.availability.taken": "This username is already taken",
    "password.show": "Show password",
    "password.hide": "Hide password",

    // Page headings (feature pages)
    "photos.heading": "Family photos",
    "photos.empty": "No photos yet — add the first one!",
    "events.heading": "Family calendar",
    "events.empty": "No events yet — add the next get-together.",
    "events.emptyMonth": "No events this month — add the first one above!",
    "events.openDay": "Nothing scheduled — it's an open day.",
    "announcements.heading": "Announcements",
    "announcements.empty": "No announcements yet — {action}",
    "announcements.empty.admin": "publish the first one above!",
    "announcements.empty.soon": "check back soon.",
    "documents.heading": "Family documents",
    "documents.empty": "No documents yet — add the first one!",
    "moments.heading": "Moments",
    "moments.empty": "No moments yet — share the first one above!",
    "chat.heading": "Family chat",
    "chat.empty": "No rooms yet — create one above.",
    "chat.roomEmpty": "Nothing yet — say hello!",

    // SEO
    "seo.home.title": "Kulaya — The Family Nest",
    "seo.home.desc":
      "A private home for photos, events, documents, and the moments in between — built for every generation.",
    "seo.fallback.desc": "Private family portal for the Kulaya family.",
    "page.notFound": "Page not found",
    "auth.forgot.title": "Forgot password",
    "auth.reset.title": "Reset password",
    "auth.verify.title": "Verify email",
    "auth.resend.title": "Resend verification",
    "offline.banner": "You're offline — showing saved family data",
  },
  hi: {
    // Brand
    "brand.name": "कुलाय",
    "brand.tagline": "परिवार का घोंसला",
    "brand.homeAria": "कुलाय होम",

    // Nav
    "nav.home": "होम",
    "nav.members": "सदस्य",
    "nav.photos": "फ़ोटो",
    "nav.events": "इवेंट",
    "nav.announcements": "घोषणाएँ",
    "nav.documents": "दस्तावेज़",
    "nav.moments": "पल",
    "nav.chat": "चैट",
    "nav.mainAria": "मुख्य नेविगेशन",

    // Global search
    "search.open": "परिवार में खोजें",
    "search.label": "खोज",
    "search.placeholder": "लोग, फ़ोटो, पल, इवेंट, दस्तावेज़, चैट खोजें…",
    "search.hint": "कम से कम 2 अक्षर लिखें — घोंसले की हर चीज़ खोजी जा सकती है",
    "search.title": "खोज",
    "search.noResults": "“{q}” के लिए कुछ नहीं मिला",
    "search.group.people": "लोग",
    "search.group.photos": "फ़ोटो",
    "search.group.posts": "पल",
    "search.group.events": "इवेंट",
    "search.group.documents": "दस्तावेज़",
    "search.group.messages": "संदेश",

    // Roles
    "role.owner": "मालिक",
    "role.admin": "प्रशासक",
    "role.parent": "अभिभावक",
    "role.adult": "वयस्क",
    "role.teen": "किशोर",
    "role.child": "बच्चा",
    "role.guest": "अतिथि",
    "role.choose": "अनुमोदन पर भूमिका",

    // Account dropdown
    "account.openMenu": "अकाउंट मेनू खोलें",
    "account.family": "परिवार केंद्र",
    "account.profile": "मेरी प्रोफ़ाइल",
    "account.approvals": "अनुमोदन सूची",
    "account.signOut": "साइन आउट",

    // Notifications
    "notify.open": "सूचनाएँ खोलें",
    "notify.title": "सूचनाएँ",
    "notify.empty": "अभी कुछ नहीं — जब कुछ होगा तो हम बताएँगे।",
    "notify.markAllRead": "सभी पढ़ी गईं मार्क करें",
    "notify.unread": "{count} अपठित",
    "notify.type.announcement": "नई घोषणा",
    "notify.type.event": "नया इवेंट",
    "notify.type.moment_like": "{name} ने आपके पल को पसंद किया",
    "notify.type.moment_comment": "{name} ने आपके पल पर टिप्पणी की",
    "notify.type.member_joined": "{name} ने जुड़ने का अनुरोध किया",
    "notify.type.approval": "आपका अकाउंट स्वीकृत है — परिवार में स्वागत है",

    // Language switcher
    "lang.switchTo": "भाषा बदलें",
    "lang.label": "English",

    // Auth toggle
    "auth.cta.join": "परिवार से जुड़ें",
    "auth.cta.welcome": "वापसी पर स्वागत है, {name}!",
    "auth.tryMode": "{mode} मोड आज़माएँ",

    // Footer
    "footer.builtWith": "हमारे परिवार के लिए प्यार से बनाया गया",
    "footer.health": "स्वास्थ्य",
    "footer.privacy": "गोपनीयता",
    "footer.terms": "शर्तें",
    "footer.contact": "संपर्क",
    "footer.navAria": "फ़ुटर",

    // Legal
    "legal.backToHome": "होम पर वापस",
    "legal.privacy.title": "गोपनीयता नीति",
    "legal.privacy.subtitle": "हम पारिवारिक जानकारी की सुरक्षा कैसे करते हैं।",
    "legal.terms.title": "उपयोग की शर्तें",
    "legal.terms.subtitle": "हमारे परिवार के स्थान को स्वस्थ रखने के सरल नियम।",
    "legal.contact.title": "संपर्क करें",
    "legal.contact.subtitle": "परिवार पहले — कभी भी संपर्क करें।",
    "legal.contact.response": "हम 48 घंटों के भीतर जवाब देने का प्रयास करते हैं।",
    "legal.contact.name": "आपका नाम",
    "legal.contact.email": "आपका ईमेल",
    "legal.contact.subject": "विषय",
    "legal.contact.message": "संदेश",
    "legal.contact.send": "ईमेल से भेजें",
    "legal.contact.mailtoNote": "यह संदेश पहले से भरकर आपका ईमेल ऐप खोलता है — कुछ भी हमारे सर्वर पर संग्रहीत या भेजा नहीं जाता।",

    // Home
    "home.badge": "कुलाय — हमारे परिवार का घोंसला घर आ रहा है",
    "home.h1": "जहाँ हमारा परिवार",
    "home.h1.accent": " पास",
    "home.h1.suffix": " रहता है, चाहे कितनी भी दूरी हो",
    "home.hero":
      "कुलाय — कुल + आलय, परिवार का घोंसला। फ़ोटो, इवेंट, दस्तावेज़ और बीच के पलों के लिए एक निजी घर — हर पीढ़ी के लिए, हर मूड में।",
    "home.currentlyOn": "अभी “{theme}” थीम पर हैं · {mode} मोड",
    "home.themesTitle": "हर पीढ़ी के लिए बना",
    "home.themesSub": "तीन थीम, हल्की और गहरी — जो घर जैसा लगे, चुनें।",
    "home.previewDark": "डार्क मोड देखें",
    "home.featuresTitle": "परिवार को चाहिए सब कुछ",
    "home.featuresSub": "कदम-दर-कदम, मज़बूत नींव पर।",
    "home.preview": "झलक",
    "home.active": "सक्रिय",
    "home.feature.photos": "फ़ोटो एल्बम",
    "home.feature.photos.desc":
      "हर उत्सव को सहेजें — पूरे परिवार के साथ एल्बम साझा करें।",
    "home.feature.events": "इवेंट और RSVP",
    "home.feature.events.desc":
      "जन्मदिन, शादियाँ और मिलन-समारोह — सब एक कैलेंडर में।",
    "home.feature.documents": "दस्तावेज़",
    "home.feature.documents.desc":
      "ज़रूरी काग़ज़ात सुरक्षित, निजी और हमेशा पहुँच में।",
    "home.feature.tree": "परिवार वृक्ष",
    "home.feature.tree.desc":
      "हमारे परिवार की डालियाँ पीढ़ी-दर-पीढ़ी बढ़ती देखें।",
    "home.feature.moments": "पल",
    "home.feature.moments.desc":
      "एक निजी फ़ीड जहाँ हर दिन पूरे परिवार से साझा हो।",
    "home.feature.announcements": "घोषणाएँ",
    "home.feature.announcements.desc":
      "पूरे परिवार से जुड़ी ख़बरों के लिए एक भरोसेमंद जगह।",

    // Login
    "login.title": "वापसी पर स्वागत है",
    "login.description": "परिवार के घोंसले में आने के लिए साइन इन करें।",

    // Dashboard (members)
    "dash.goodMorning": "सुप्रभात",
    "dash.goodAfternoon": "नमस्ते",
    "dash.goodEvening": "शुभ संध्या",
    "dash.welcomeName": ", {name}",
    "dash.quickActions": "त्वरित कार्य",
    "dash.updates": "घोंसले के आस-पास",
    "dash.latestAnnouncement": "नवीनतम घोषणा",
    "dash.nextEvent": "अगला इवेंट",
    "dash.noEvents": "कुछ निर्धारित नहीं — खुले दिन का आनंद लें।",
    "dash.noAnnouncements": "अभी कोई घोषणा नहीं।",
    "dash.viewAll": "सभी देखें",
    "login.email": "ईमेल या यूज़रनेम",
    "login.password": "पासवर्ड",
    "login.emailPlaceholder": "you@example.com",
    "login.submit": "साइन इन",
    "login.forgot": "पासवर्ड भूल गए?",
    "login.noAccount": "परिवार में नए हैं?",
    "login.createAccount": "अकाउंट बनाएँ",
    "login.error.invalid": "ईमेल या पासवर्ड सही नहीं मिला। फिर से कोशिश करें।",
    "login.error.notVerified":
      "आपका ईमेल अभी सत्यापित नहीं है — सत्यापन लिंक के लिए इनबॉक्स देखें।",
    "login.error.pending":
      "आपका अकाउंट प्रशासक के अनुमोदन की प्रतीक्षा में है। जल्द ही देखें।",
    "login.error.rejected": "इस अकाउंट को अनुमति नहीं दी गई।",
    "login.error.rateLimited":
      "बहुत अधिक कोशिशें — कृपया एक मिनट रुककर फिर कोशिश करें।",
    "login.error.generic": "कुछ गड़बड़ हो गई। फिर से कोशिश करें।",
    "login.success": "वापसी पर स्वागत है",

    // Register
    "register.title": "परिवार से जुड़ें",
    "register.description":
      "अपना अकाउंट बनाएँ — अंदर आने से पहले एक सदस्य को इसे मंज़ूर करना होगा।",
    "register.name": "पूरा नाम",
    "register.namePlaceholder": "आरव शर्मा",
    "register.email": "ईमेल",
    "register.username": "यूज़रनेम",
    "register.usernameHint": "3–30 अक्षर, अक्षर, अंक, अंडरस्कोर",
    "register.password": "पासवर्ड",
    "register.submit": "अकाउंट बनाएँ",
    "register.already": "पहले से परिवार के साथ हैं?",
    "register.signIn": "साइन इन",
    "register.availability.checking": "जाँच हो रही है…",
    "register.availability.available": "यूज़रनेम उपलब्ध है",
    "register.availability.taken": "यह यूज़रनेम पहले से लिया हुआ है",
    "password.show": "पासवर्ड दिखाएँ",
    "password.hide": "पासवर्ड छिपाएँ",

    // Page headings (feature pages)
    "photos.heading": "परिवार की फ़ोटोज़",
    "photos.empty": "अभी कोई फ़ोटो नहीं — पहली फ़ोटो जोड़ें!",
    "events.heading": "परिवार कैलेंडर",
    "events.empty": "अभी कोई इवेंट नहीं — अगला मिलन-समारोह जोड़ें।",
    "events.emptyMonth": "इस महीने कोई इवेंट नहीं — ऊपर पहला इवेंट जोड़ें!",
    "events.openDay": "कुछ निर्धारित नहीं — एक खुला दिन है।",
    "announcements.heading": "घोषणाएँ",
    "announcements.empty": "अभी कोई घोषणा नहीं — {action}",
    "announcements.empty.admin": "ऊपर पहली घोषणा करें!",
    "announcements.empty.soon": "जल्द ही देखें।",
    "documents.heading": "परिवार के दस्तावेज़",
    "documents.empty": "अभी कोई दस्तावेज़ नहीं — पहला दस्तावेज़ जोड़ें!",
    "moments.heading": "पल",
    "moments.empty": "अभी कोई पल नहीं — ऊपर पहला पल साझा करें!",
    "chat.heading": "परिवार चैट",
    "chat.empty": "अभी कोई कमरा नहीं — ऊपर एक बनाएँ।",
    "chat.roomEmpty": "अभी कुछ नहीं — नमस्ते कहें!",

    // SEO
    "seo.home.title": "कुलाय — परिवार का घोंसला",
    "seo.home.desc":
      "फ़ोटो, इवेंट, दस्तावेज़ और बीच के पलों के लिए एक निजी घर — हर पीढ़ी के लिए।",
    "seo.fallback.desc": "कुलाय परिवार के लिए निजी पारिवारिक पोर्टल।",
    "page.notFound": "पेज नहीं मिला",
    "auth.forgot.title": "पासवर्ड भूल गए",
    "auth.reset.title": "पासवर्ड रीसेट करें",
    "auth.verify.title": "ईमेल सत्यापित करें",
    "auth.resend.title": "सत्यापन फिर भेजें",
    "offline.banner": "आप ऑफ़लाइन हैं — सहेजा गया परिवार डेटा दिखाया जा रहा है",
  },
} as const satisfies Record<Language, Record<string, string>>;
