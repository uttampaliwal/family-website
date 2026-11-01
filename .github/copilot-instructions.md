# Copilot instructions

Read `AGENTS.md` at the repo root first — it is the binding contract for AI-assisted work here.

Fast facts:

- pnpm + Turborepo, Node 24: `pnpm lint | typecheck | test | build` run across `apps/web`, `apps/api`, `packages/core`, `packages/ui`.
- Contracts first: new/changed API fields get a Zod schema in `packages/core/src/schemas/`, then route (`apps/api/src/app.ts`), then web client.
- Authz: use `apps/api/src/middleware/security.ts::requireApprovedAuth` tiers; upload/storage features must go through `src/lib/quotas.ts` + checksum/magic-byte helpers (P2 contracts).
- Ports: dev web `:3000` (Vite, `/api` proxy), dev API `:3001` (`PORT` shift logic in `apps/api/src/config/env.ts`, `API_PORT` overrides). Don't trust older docs claiming otherwise.
- Same-origin serverless glue: `apps/web/api/index.ts` importing `apps/api` is the ONLY cross-app import (documented exception).
- A11y/SEO: new pages get `useSeo`, focus management, aria attributes. i18n strings live in `src/i18n/translations*.ts` (EN/HI).
- Docs: `docs/` is strong; `docs/p0-baseline.md` is a historical snapshot. README/docs already fixed for ports; keep `CHANGELOG.md` current per milestone.
- Conventional commits; PRs must see `pnpm lint`, `typecheck`, `test`, `build` green (mirrors `.github/workflows/ci.yml`).
