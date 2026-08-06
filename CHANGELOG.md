# Changelog

All notable changes to Kulaya. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows
[git-workflow.md](docs/git-workflow.md) (one PATCH tag per milestone).

## [v0.3.10] — 2026-08-07

### Added

- **In-app notifications** — header bell with unread badge, dropdown that
  lists recent notifications with relative timestamps, and live SSE updates.
- Backend: `Notification` model; `/api/notifications` (paged list, unread
  count), `/unread-count`, `/:id/read`, `/read-all`, `DELETE /:id`,
  `/stream`.
- Triggers: new announcement → all approved members; new event → all
  approved members; moment liked / commented → the author; account approved →
  the member; new registration → admins.
- Per-recipient SSE channels (`lib/sse.ts`) so pushes only reach the owner.
- 14 new API tests (total 125).

## [v0.3.9] — 2026-08-06 — M12 (UX hardening)

### Added

- Member dashboard on `/` for signed-in users (greeting, date, quick actions,
  latest event + announcement previews).
- `ErrorBoundary` (Try again / Reload / Go home) and route-focus management
  for keyboard + screen-reader users.
- Live username availability check on registration + password show/hide.
- Legal pages: `/privacy-policy`, `/terms`, `/contact`; footer replaced dead
  links with real routes.
- API: `GET /auth/check-username`; 3 new tests (total 111).

## [v0.3.8] — 2026-08-06 — M11 (i18n & SEO)

### Added

- Full EN/HI internationalization, persisted language, `<html lang>` sync.
- Per-page SEO titles + descriptions via `useSeo`.
- Lazy-loaded routes (React.lazy + Suspense), robots.txt + sitemap.xml.

## [v0.3.7] — M10 — Real-time chat

### Added

- Chat rooms, messages, SSE push (`/chat/events`), unread room state,
  mark-room-read. Fetch-based SSE reader (EventSource can't use bearer
  tokens).

## [v0.3.6] — M9 — Moments

### Added

- Family feed: posts (`POST/DELETE /api/posts`), likes (toggle), threaded
  comments; author-gated moderation.

## [v0.3.5] — M8 — Documents

### Added

- Private document archive with direct-to-R2 uploads (≤ 25 MB snapshot),
  revocable public share links.

## [v0.3.4] — M7 — Announcements

### Added

- Admin announcement feed, approval queue for new members, email on publish
  (Resend), admin member management.

## [v0.3.3] — M6 — Events

### Added

- Events & calendar: month grid, yearly recurrence, event list + detail.

## [v0.3.2] — M5 — Photos

### Added

- Photo gallery with direct-to-R2 presigned uploads (private bucket, ≤ 20 MB,
  jpeg/png/webp/gif/avif/heic).

## [v0.3.1] — M4 — Family tree

### Added

- Generation view, editor with parent validation (cycle & >2-parent guards),
  member profile URLs.

## [v0.3.0] — M1–M3 — Foundation

### Added

- pnpm + Turborepo monorepo (`apps/web`, `apps/api`, packages `core`, `ui`).
- Design system: 3 themes (Warm Elegant / Minimal / Playful) × light/dark,
  FOUC-free theming.
- Auth scaffold: HttpOnly JWT, CSRF, rate limits, admin approval flow,
  email verification via Resend.
- CI (lint → typecheck → test → build) on every push/PR.
- Health endpoint + shared Zod contracts in `packages/core`.

[Unreleased]: https://github.com/uttampaliwal/family-website/compare/v0.3.10...HEAD
[v0.3.10]: https://github.com/uttampaliwal/family-website/compare/v0.3.9...v0.3.10
[v0.3.9]: https://github.com/uttampaliwal/family-website/compare/v0.3.8...v0.3.9
[v0.3.8]: https://github.com/uttampaliwal/family-website/compare/v0.3.7...v0.3.8
[v0.3.7]: https://github.com/uttampaliwal/family-website/compare/v0.3.6...v0.3.7
[v0.3.6]: https://github.com/uttampaliwal/family-website/compare/v0.3.5...v0.3.6
[v0.3.5]: https://github.com/uttampaliwal/family-website/compare/v0.3.4...v0.3.5
[v0.3.4]: https://github.com/uttampaliwal/family-website/compare/v0.3.3...v0.3.4
[v0.3.3]: https://github.com/uttampaliwal/family-website/compare/v0.3.2...v0.3.3
[v0.3.2]: https://github.com/uttampaliwal/family-website/compare/v0.3.1...v0.3.2
[v0.3.1]: https://github.com/uttampaliwal/family-website/compare/v0.3.0...v0.3.1
[v0.3.0]: https://github.com/uttampaliwal/family-website/releases/tag/v0.3.0
