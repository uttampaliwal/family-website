# AGENTS.md

## Mission

Kulaya — The Family Nest — is a **private, authenticated family portal** (photos, events, documents, moments, chat, announcements, rule-based NL search) deployed on Vercel + MongoDB Atlas + Cloudflare R2 + Resend. It holds real family photos and personal data: **privacy and authz correctness outrank convenience in every decision.**

Golden rules: pnpm + Turborepo, Node 24, shared ESLint/prettier/type gates, `packages/core` Zod schemas are the single API contract, and never let user content leak into logs/URLs/git.

## Non-negotiable rules

1. No secrets, keys, or real personal data in code or tests. Test-only secrets live inline in `apps/api/src/tests/` config, prod secrets must come from env; `apps/api/.env.example` is the template of record.
2. **Every new/changed API surface gets its Zod schema in `packages/core` first** (`src/schemas/*`), then the Hono route (`apps/api/src/app.ts` route list), then the web client (`apps/web`). No skipping the contract layer.
3. Architecture is deliberate, don't fight it:
   - pnpm monorepo: `apps/web` (React 19 + Vite + Tailwind v4 + TanStack Query + Zustand), `apps/api` (Hono + Mongoose 8 + jose JWT + Resend + R2 SDK), `packages/core` (contracts), `packages/ui` (Radix-based design system + tokens).
   - `apps/web/api/index.ts` is the **documented exception** to "never let an app import another app": it imports `apps/api` so the API rides along as a same-origin serverless function. Any other cross-app import is a bug.
   - Authz is centralized: use `middleware/security.ts::requireApprovedAuth` for protected routes — do not reintroduce per-route scattered checks (P1 fixed exactly this).
   - Access tokens are memory-only on the web client (`url-token` helpers); never persist them to localStorage "for convenience".
4. Upload pipeline rules (P2): checksums + magic-byte verification, per-member daily budget + family quota (`src/lib/quotas.ts`), authed short-TTL download URLs, ObjectId validation. Don't bypass `quotas.ts` when adding storage surfaces.
5. Health semantics: `/live` = process up, `/ready` = dependencies reachable — keep the split (P2) when touching infra.
6. Lint/type/test gates: root `pnpm lint | typecheck | test | build` runs Turbo across the workspace; web build runs `tsc --noEmit` too. ESLint is configured (not yet with react-hooks/jsx-a11y plugins — don't rely on them catching things).
7. Conventional commits; one theme per commit; user-visible changes get a `CHANGELOG.md` entry on merge to the next milestone/tag.

## Repo facts agents must know

- Node 24 (`.nvmrc`, engines-strict), pnpm 11.20 via `packageManager`; Turbo 2.5 pipelines: `build` → deps' builds, `lint/typecheck/test` cached behind `^build`.
- **Ports:** dev web = `:3000` (Vite `strictPort`, `/api` proxied) , dev API = `:3001` (`env.ts` force-shifts PORT 3000→3001; `API_PORT` overrides). Older docs/README claiming 3000-for-API/5173-for-web are fixed; keep it that way.
- Runtime state: `apps/api/uploads/` (local-only storage fallback, gitignored); Mongo (local docker Atlas prod); R2 object storage; Resend for email (keyless → logs emails in dev).
- All-family data is user-generated content in MongoDB: there is no static content layer; i18n copy is the hardcoded bilingual pair in `apps/web/src/i18n/translations.ts` + `translations-hi.ts` (EN/HI).
- Metadata: static OG in `apps/web/index.html` + per-page `useSeo`; `sitemap.xml` + canonical URLs exist while `index.html` ALSO sets `noindex,nofollow` (intentional pre-launch — coordinate before flipping).
- `docs/p0-baseline.md` is a dated historical snapshot; current security state lives in `SECURITY.md` + `CHANGELOG.md`.
- Web SECURITY advisories go through `SECURITY.md` (contact email committed there intentionally).
- `packages/ui` has no `test` script yet (Turbo tolerates it — the gap is documented in ROADMAP, don't "fix" silently).

## Coding standards

- Strict TS everywhere (`tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`).
- Web pages are route components (React Router v7 lazy) that compose `packages/ui` primitives — no business logic in UI primitives, no fetches outside lib/api-client + TanStack Query hooks.
- API handlers: validate input via Zod (`packages/core`) → use `env.ts`-typed config → log via pino with redaction. Never `console.log` auth artifacts.
- Error paths: API returns typed error envelopes; web `ErrorBoundary` + route-focus must keep firing for new pages.
- Accessibility is a product requirement: Radix primitives + semantic html; when adding pages, wire `useSeo`, focus management, and aria as you go (15 pages lack aria today — don't add a 16th).

## Commit guidelines

- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `perf:`, `test:`); scope conventions in `docs/git-workflow.md` (milestone-tagged branches like `feat/p2-storage`).
- PRs: include which gates run (`pnpm lint/typecheck/test/build`) and mention any contract (`packages/core`) change prominently.
- Branches: `feat/*`, `fix/*`, `chore/*`; `main` is protected via PR flow (see `docs/git-workflow.md`): only merge green CI.

## AI workflow expectations

- Read `docs/architecture.md`, `docs/data-lifecycle.md`, `docs/environment-variables.md`, `docs/threat-model.md`, `docs/testing.md` before non-trivial work.
- Incremental diffs: never reorganize apps/packages folder layout in a feature commit.
- When adding endpoints: route → Zod schema → authz tier (public / requireApprovedAuth / admin) → quota check if storage → tests (copy an existing harness file first).
- When adding pages: router lazy entry + `useSeo` + a11y pass + loading/error states.

## Required outputs for significant work

1. Summary. 2. Why. 3. Risks (authz, quota, PII, migrations!). 4. Files affected. 5. Gates run.

## Validation before completing anything

```bash
pnpm turbo lint typecheck      # or pnpm lint / pnpm typecheck at root
pnpm test                      # vitest across api/web/packages
pnpm build                     # apps build with tsc --noEmit check
```

Touching storage/auth/quotas? Also run the specific suite, e.g. `pnpm --filter @family/api test src/tests/documents` and review `docs/data-lifecycle.md` still matches.

## Escalation

Stop and propose before touching: auth/session middleware, upload/quotas/R2 signed URLs, DB schemas (migrations need a data-plan), the Vercel `functions` config for the same-origin API, CSP/headers in `apps/web/vercel.json`, or the noindex/indexing switching decision.
