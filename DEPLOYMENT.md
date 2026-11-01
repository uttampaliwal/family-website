# DEPLOYMENT.md

Runbook: **docs/deployment.md** is the detailed, tested runbook (Vercel + Atlas + R2 + Resend, incl. R2 CORS policy JSON and env checklist). This file is the quick channel.

## Topology

- **Vercel** hosts the web SPA and — via `apps/web/api/index.ts` — the **same-origin `/api` serverless function** (imports the Hono app; `apps/web/vercel.json` sets framework/build/CSP headers).
- **MongoDB Atlas M0** (free tier) is the database; **Cloudflare R2** stores photos/documents via S3-compatible API; **Resend** sends transactional email (`EMAIL_FROM` domain must be verified).
- Health: `/api/health` (live/ready split since v0.4.1).

## Deploy checklist (short form)

1. Env vars in Vercel (from `apps/api/.env.example`): `DATABASE_URL`, `WEB_ORIGIN`, auth secrets, `R2_*`, `RESEND_API_KEY`/`EMAIL_FROM`, `ADMIN_*`. Quota/`UPLOAD_*`/`FAMILY_QUOTA_BYTES` optional (defaults in `env.ts`).
2. `vercel` deploy is build-only (`pnpm --filter @family/web build`); no app-side containers involved. `docker-compose.yml` is dev Mongo only — it never touches prod.
3. Configure R2 bucket CORS for direct uploads (exact policy JSON in `docs/deployment.md`).
4. Seed the first admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD` + `pnpm --filter @family/api seed-admin` against prod DB).
5. Sanity: `GET /api/live` (fast) vs `GET /api/ready` (deps) — only `/ready` green means usable.

## SSE + serverless caveat

Chat/notifications stream via SSE; the committed `apps/web/vercel.json` has **no `maxDuration` override**, so long streams are bounded by plan defaults. The runbook documents the optional `functions` block — keep file and doc in sync.

## Multi-environment

- Dev: local docker Mongo; `apps/api/uploads/` local-disk fallback when R2 vars are unset; emails logged not sent.
- Prod: Atlas + R2 + Resend; upload/quotas enforced at runtime (`src/lib/quotas.ts`).
- Vercel preview deploys reuse the same env contract; make sure `WEB_ORIGIN` lists allowed preview origins or use same-origin (default) so previews are self-contained.
