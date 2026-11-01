# ARCHITECTURE.md

Fast, factual entry point. Deep dives live in `docs/` (`architecture.md` is excellent and matches the code).

## What it is

"Kulaya — The Family Nest": a private family portal. React SPA + same-origin serverless API on Vercel; MongoDB Atlas; Cloudflare R2 for photos/documents; Resend for transactional email. All content behind auth (guest/registration flows for new members + admin approvals).

## Stack snapshot (real)

- **Web** (`apps/web`): React 19 + Vite 7 + Tailwind v4, react-router v7 (lazy routes), TanStack Query 5 + Zustand, `vite-plugin-pwa` (offline shell), Vitest + jsdom. Dev server **:3000** with `/api` proxied to :3001.
- **API** (`apps/api`): Hono 4.9 under `/api` — routes: auth, members, admin, photos, events, announcements, documents, shared (token downloads), posts, chat, search (+ rule-based NL layer), notifications, health (`/live` vs `/ready` split). Mongoose 8 + jose JWT + bcryptjs + Resend + S3/R2 SDK + pino. Vitest with `mongodb-memory-server` (binaries pre-warmed).
- **Packages** (TS-source, no build step): `packages/core` — Zod contract schemas for 15 domains + capability matrix; `packages/ui` — Radix-based design system with 3 themes (warm/minimal/playful × light/dark tokens).
- **Serverless glue**: `apps/web/api/index.ts` imports the API app (`hono/vercel`) so web + API deploy as one same-origin Vercel project. This is the deliberate exception to the "no cross-app imports" rule.

## Depot/deployment

- Vercel project per `apps/web/vercel.json` (Vite framework preset, CSP + Referrer + nosniff + Permissions-Policy headers).
- `docker-compose.yml` = local Mongo 7 only. No app images by design; Vercel is the deployment.
- Data layer external: Atlas M0 (prod), R2 (media), Resend (email). Happy-path config lives in `apps/api/.env.example`.

## Request flow (protected feature)

1. Web route (lazy) → TanStack Query → `lib/api-client` (Bearer from memory; CSRF token cookie flow)
2. Hono route in `apps/api/src/app.ts` → `requireApprovedAuth` (or public/admin tier) → Zod-validated via `packages/core` schema
3. Domain lib (e.g. `lib/quotas.ts` for uploads) → Mongoose/R2/Resend
4. Typed response envelope → pino audit/redaction on the way out

## repo map

```
apps/web/        SPA (pages/, components/, lib/, i18n/, src/app/router.tsx)
apps/web/api/    Vercel serverless entry (imports apps/api)
apps/api/        Hono app (src/app.ts, middleware/, lib/, config/, scripts/seed-admin)
packages/core/   Zod schemas + capabilities (contracts)
packages/ui/     Radix UI kit + tokens (3 themes × light/dark)
docs/            architecture, deployment, security, threat-model, data-lifecycle,
                 testing, git-workflow, p0-baseline (historical), roadmap
```

## Known debts (tracked in ROADMAP.md)

- `apps/web/index.html` sets `noindex,nofollow` while sitemap/canonical imply an indexable site — launch decision.
- No Playwright e2e yet; `packages/ui` lacks a `test` task; eslint lacks `react-hooks`/`jsx-a11y` plugins.
- Static OG only (no OG image); 15 pages lack aria attributes.
- `turbo.json` `globalDependencies` previously watched a root `.env` nothing loads — fixed to `apps/api/.env.local` + `apps/web/.env.local`.
