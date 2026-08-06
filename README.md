# Kulaya — The Family Nest

> कुल + आलय — "the family's nest."

A private, modern hub for our family — built on a best-in-class stack, deployed on a fully free tier.

## Workspace

```
apps/
  web/    React 19 + Vite 7 + Tailwind v4 + react-router v7 (PWA)
  api/    Hono API (serverless-ready) + MongoDB via Mongoose
packages/
  core/   Shared Zod schemas & types (single source of truth)
  ui/     Design system: 3 themes × light/dark, Radix primitives
```

## Stack highlights

- **Monorepo**: pnpm + Turborepo
- **Theming**: Warm Elegant / Minimal / Playful × light/dark, persisted, FOUC-free
- **Auth (next milestone)**: JWT in HttpOnly cookies, CSRF-safe, rate-limited
- **Storage (next milestone)**: Cloudflare R2 presigned uploads (10 GB free)
- **Deploy target**: Vercel (web + API functions) + MongoDB Atlas M0 + R2 + Resend — all free tiers

## Getting started

```bash
pnpm install

# Terminal 1 — API (needs MongoDB running locally, or set DATABASE_URL)
pnpm --filter @family/api dev

# Terminal 2 — Web
pnpm --filter @family/web dev
```

Open http://localhost:5173.

## Quality gates

```bash
pnpm lint        # ESLint (flat config, shared)
pnpm typecheck   # strict TS across all packages
pnpm test        # Vitest (API + web)
pnpm build       # Turbo pipeline
```

CI runs all four on every push/PR via GitHub Actions.

## Roadmap

1. Foundation & theming (this milestone)
2. Auth & security (HttpOnly JWT, CSRF, admin approval)
3. Profiles + family tree
4. Announcements & notifications
5. Events & RSVP calendar
6. Documents (R2 uploads, share links)
7. Photo albums
8. Real-time chat (SSE)
9. Family feed — “Moments” (posts, likes, comments)
10. i18n (EN/HI), SEO, a11y & perf pass

## Environment

Copy `apps/api/.env.example` → `apps/api/.env.local` and fill in values.
Never commit real secrets — everything is gitignored.
