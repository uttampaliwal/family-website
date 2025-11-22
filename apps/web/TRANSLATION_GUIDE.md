# Translation System - Best Practices

## Overview

This project uses **i18next with namespaced translations** for scalable internationalization.

## Structure

```
public/locales/
├── en/
│   ├── common.json      # Shared UI elements (nav, auth, theme, actions)
│   ├── home.json        # HomePage-specific content
│   ├── footer.json      # Footer content
│   ├── calendar.json    # Calendar component (to be created)
│   ├── weather.json     # Weather widget (to be created)
│   └── privacy.json     # Privacy policy page (to be created)
└── hi/
    └── (same structure)
```

## Usage

### Basic Usage (Common Namespace)

```tsx
import { useTranslation } from "react-i18next";

const MyComponent = () => {
  const { t } = useTranslation(); // Defaults to 'common' namespace

  return <h1>{t("app.title")}</h1>; // "Yuva Kulya"
};
```

### Using Specific Namespaces

```tsx
const HomePage = () => {
  const { t } = useTranslation("home"); // Load 'home' namespace

  return <h1>{t("welcome")}</h1>; // Uses home:welcome
};
```

### Using Multiple Namespaces

```tsx
const MyComponent = () => {
  const { t } = useTranslation(["common", "home"]);

  return (
    <>
      <h1>{t("common:app.title")}</h1>
      <p>{t("home:tagline")}</p>
    </>
  );
};
```

### Dynamic Content

```tsx
// For API data that needs translation
const announcement = {
  type: "birthday",
  recipientName: "Priya",
};

// In component
<p>{t(`announcements.${announcement.type}`)}</p>;
```

## Adding New Translations

### 1. Create a New Namespace

Create files in `public/locales/[lang]/[namespace].json`:

```json
// public/locales/en/calendar.json
{
  "title": "Family Calendar",
  "today": "Today",
  "month": "Month",
  "week": "Week",
  "day": "Day"
}
```

### 2. Update i18n Config (optional)

If the namespace should load initially, add it to `src/lib/i18n.ts`:

```ts
ns: ["common", "home", "footer", "calendar"], // Add your namespace
```

### 3. Use in Component

```tsx
const Calendar = () => {
  const { t } = useTranslation("calendar");
  return <h2>{t("title")}</h2>;
};
```

## Key Principles

1. **Namespace by Feature/Page** - Keep related translations together
2. **Common for Shared UI** - Buttons, navigation, etc. go in `common`
3. **Lazy Load When Possible** - Only load namespaces when needed
4. **Consistent Key Structure** - Use dot notation (e.g., `user.profile.name`)
5. **No Hardcoded Strings** - Always use translation keys

## Translation Keys Naming Convention

- **Hierarchical**: `section.subsection.key`
- **Descriptive**: `calendar.addEvent` not `calendar.btn1`
- **Consistent Case**: Use camelCase for keys
- **Plural Forms**: Use `_one`, `_other` suffixes when needed

## Examples

### Good ✅

```tsx
t("auth.signIn");
t("home.welcome_message.goodMorning");
t("calendar.month.january");
```

### Bad ❌

```tsx
t("signIn"); // Too generic
t("SIGNIN"); // Wrong case
t("btn1"); // Not descriptive
```

## Current Namespaces

| Namespace | Purpose            | Components                                   |
| --------- | ------------------ | -------------------------------------------- |
| `common`  | Shared UI elements | Header, Nav, Auth buttons                    |
| `home`    | HomePage content   | HomePage, WelcomeMessage, AnnouncementTicker |
| `footer`  | Footer content     | ModernFooter                                 |

## To Be Created

- `calendar.json` - Calendar component
- `weather.json` - Weather widget
- `privacy.json` - Privacy policy page
- `terms.json` - Terms of service page
- `sitemap.json` - Sitemap page
- `profile.json` - User profile page
- `settings.json` - Settings page

## Handling Dynamic Content

For content from APIs or databases:

1. Store language-specific content in the database
2. Use translation keys as identifiers
3. Fallback to translation files for UI labels

```tsx
// API returns: { titleKey: "announcements.birthday", recipient: "Priya" }
const announcement = await fetchAnnouncement();

return <p>{t(announcement.titleKey, { name: announcement.recipient })}</p>;
```

## Testing Translations

1. Switch language using the language switcher
2. Check all pages and components
3. Look for missing keys (will show the key path if not found)
4. Verify pluralization and interpolation work correctly
