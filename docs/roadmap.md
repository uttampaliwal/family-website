# Roadmap

Milestone cadence: each shipped milestone merges via PR on `main` and gets a
PATCH tag (`v0.3.x`). See [git-workflow.md](git-workflow.md) for the rules.

## Shipped

| Tag       | Milestone              | Highlights                                                                          |
| --------- | ---------------------- | ----------------------------------------------------------------------------------- |
| `v0.3.0`  | M1–M3 baseline         | Monorepo, design system (3 themes), CI, health endpoint                             |
| `v0.3.1`  | M4 — family tree       | Generation view, relationship editor, validation                                    |
| `v0.3.2`  | M5 — photos            | Direct-to-R2 presigned uploads, gallery                                             |
| `v0.3.3`  | M6 — events & calendar | Month grid, yearly recurrence                                                       |
| `v0.3.4`  | M7 — announcements     | Admin feed, email on publish, approval queue                                        |
| `v0.3.5`  | M8 — documents         | Private archive, revocable public share links                                       |
| `v0.3.6`  | M9 — Moments           | Family feed: posts, likes, comments                                                 |
| `v0.3.7`  | M10 — real-time chat   | Rooms, SSE push, unread state                                                       |
| `v0.3.8`  | M11 — i18n & SEO       | EN/HI, per-page meta, code-split routes                                             |
| `v0.3.9`  | M12 — UX hardening     | Member dashboard, error boundary, live username check, legal pages, password reveal |
| `v0.3.10` | M13 — notifications    | Bell + unread badge, mark read/all, per-recipient SSE                               |

## Planned (candidates)

Order is a suggestion, not a promise — pick what the family needs most:

- **M14 — deployment day** — apply [deployment.md](deployment.md) to a live
  domain; resolve the SSE-on-serverless question (persistent host or
  reconnect-tolerant streaming); set up backups + uptime checks (policy in
  [data-lifecycle.md](data-lifecycle.md)).
- **Email digests** — a weekly "what happened in the nest" email; needs a
  cron source (Vercel cron on Hobby is limited — a GitHub Actions scheduled
  run or a persistent host works).
- **Chat mentions & typing indicators** — `@name` mention notifications,
  per-room presence.
- **Profile photos / avatars** — let members upload their own avatar.
- **Mobile PWA polish** — push notifications (Web Push + VAPID), install
  prompt, offline-first caching of key routes.
- **Admin dashboard** — member stats, storage usage, activity feed.
- **RSVP on events** — going/maybe/decline with a headcount.
- **Photos: albums & faces** — curated albums, tag family members in photos.
- **Accessibility sweep** — keyboard nav audit, contrast pass, screen-reader
  walkthroughs on every route.
- **Dedicated hosting** — the SSE note above is the main driver; a persistent
  VPS/container host unlocks true real-time and simpler crons.

## Principles

- Small, reviewable milestones; four quality gates must pass in CI.
- Family-scale assumptions are deliberate (single-process pub/sub, in-memory
  rate limits) — don't add distributed machinery until it's painful.
- Every milestone ships with tests for the new surface.
