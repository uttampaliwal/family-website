# DEVELOPMENT.md

## Prerequisites

Node 24 (`.nvmrc`, engines-strict via `.npmrc`), pnpm 11.20 (pinned by `packageManager`; corepack handles it), Docker (optional, for local Mongo).

## One-time setup

```bash
pnpm install
cp apps/api/.env.example apps/api/.env.local   # fill in secrets (R2/Resend optional)
docker compose up -d                           # Mongo 7 on :27017 (or point DATABASE_URL at Atlas)
pnpm --filter @family/api seed-admin           # prompts/uses ADMIN_EMAIL/ADMIN_PASSWORD env
```

## Everyday

```bash
pnpm dev      # turbo dev: web → http://localhost:3000, API → :3001 (watch)
pnpm build    # turbo build (web: tsc --noEmit && vite build)
pnpm test     # vitest across api / web / packages/core
pnpm lint && pnpm typecheck && pnpm format:check
```

Port reality: web owns `:3000` (strict), API owns `:3001` (`env.ts` force-shifts a `PORT=3000` attempt; override with `API_PORT`). Older docs that said "API :3000 / web :5173" were wrong — this file is now the truth.

## Repo map

- `apps/web/src/app/router.tsx` — all routes (public auth pages + protected family/area); `pages/` colocated; `lib/` for api-client/seo/quotas/uploads; `src/i18n/` for the hardcoded EN/HI strings.
- `apps/api/src/app.ts` wires the Hono `/api` routes; `src/tests/` hosts the per-domain e2e-style suites; `scripts/seed-admin.ts` creates the first admin.
- `packages/core/src/schemas/` — Zod per domain; `packages/ui/src/` — primitives + `styles/tokens.css` theme system.
- `docs/` — architecture/deployment/security/threat-model/data-lifecycle/testing/environment-variables/git-workflow/roadmap (+ `p0-baseline.md` as a historical audit record).

## Environment

See `apps/api/.env.example` (canonical, complete) and root `.env.example` (index). Ports, quotas and auth TTLs are all documented in `docs/environment-variables.md`.

## Testing notes

API tests boot a fresh MongoMemoryServer and drive the real HTTP surface (CSRF cookie → login → Bearer). Copy an existing file (e.g. `events.test.ts`) when adding coverage for a new route. Test-only secrets are committed intentionally and unsupported in production.

## Deployment

Root DEPLOYMENT.md + docs/deployment.md (Vercel + Atlas + R2 + Resend runbook incl. R2 CORS policies).
