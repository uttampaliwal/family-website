# August 2025 Refactor: UI Consolidation and Stability

This document summarizes optimizations made across the project to consolidate files, standardize code, and improve UI/UX stability without introducing breaking changes.

## 1. File consolidation

- Created a shared base button implementation used by all button components.
  - Added: `apps/web/src/components/ui/ButtonBase.tsx`
  - Updated: `apps/web/src/components/Button.tsx` and `apps/web/src/components/ThemeButton.tsx` now delegate to `ButtonBase` while preserving their existing public APIs.
  - Backward compatibility: Existing imports (`Button`, `ThemeButton`) continue to work. Variants map to the same visual styles via unified CSS classes.

## 2. Code standardization

- Removed inline styles and moved them to CSS utilities in `apps/web/src/index.css`:
  - App layout container now uses `.app-root` and `.main-flex-auto` classes.
  - Toast stacking uses `.toast-item` and maintains z-index stacking without inline styling of transform properties beyond the dynamic offset.
  - Calendar event badges use `.calendar-event` class; color tint remains data-driven.
- Unified button rendering via `.btn` and variant classes, ensuring consistent hover/focus/disabled behaviors.

## 3. UI/UX improvements

- Reduced layout shifts (CLS) during theme toggles using layout stabilizers in CSS and consistent spacing.
- Ensured text color utilities (`.text-base`, `.text-muted`, etc.) are consistently available across pages via `index.css` (leveraging existing theme tokens).
- Kept the existing theme system intact; only added small utilities to improve stability.

## 4. Best practices

- Consolidated button logic to a single place (`ButtonBase`) for easier maintenance.
- Replaced ad-hoc inline styles with CSS classes to improve readability and caching.
- Kept existing routes, components, and APIs unchanged to avoid breaking workflows.

## Changed files

- Added: `apps/web/src/components/ui/ButtonBase.tsx`
- Updated: `apps/web/src/components/Button.tsx`
- Updated: `apps/web/src/components/ThemeButton.tsx`
- Updated: `apps/web/src/App.tsx` (removed inline layout styles)
- Updated: `apps/web/src/context/ToastProvider.tsx` (removed inline style usage where possible)
- Updated: `apps/web/src/components/FamilyCalendar.tsx` (moved styling to class)
- Updated: `apps/web/src/index.css` (new utility classes and stability improvements)

## Migration notes (if extending)

- Prefer importing and using `ThemeButton` or `Button` as before. Both are now backed by `ButtonBase`.
- When creating new button variants/sizes, extend `ButtonBase` mappings and corresponding CSS in `index.css`.
- Avoid inline styles in components; add/extend utilities in `index.css` instead for consistency.

No runtime behaviors were intentionally changed; these edits should be fully backward compatible.
