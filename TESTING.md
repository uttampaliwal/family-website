# TESTING.md

## Layout (real, verified)

| Area | Files | Notes |
|---|---|---|
| API e2e-style suites | `apps/api/src/tests/*.test.ts` — **18 files, ~206 cases** | Real Hono app + MongoMemoryServer; CSRF→login→Bearer harness; pino-redacted logs |
| Web unit | `apps/web/src/**` — 7 files (`button`, `search-bar`, `encode-image`, `file-hash`, `offline`, `url-token`, `virtual-window`) | Vitest + jsdom |
| Contract schemas | `packages/core/src/schemas/auth.test.ts` (~34 cases) | Zod contract tests |
| E2E/browser | — | none yet (planned `v0.4.2` per `docs/git-workflow.md`) |

## Commands

```bash
pnpm test                                     # turbo across api/web/core
pnpm --filter @family/api test src/tests/auth # single suite
pnpm --filter @family/web test src/lib        # web-only slice
```

Vitest caches Mongo binaries via global setup (no per-run download). Tests set inline test-only secrets; production env validation forbids those values.

## Conventions

- API test = one domain file mirroring one route group. Steps: boot `createApp()` + mongo memory, prime CSRF via `GET /api/auth/csrf-token`, create users directly (`User.create` + hash), sign in, drive HTTP exactly as the SPA does.
- No snapshots of PII; use the synthetic member fixtures already in the repo.
- Auth flows must test the negative ("approved-only") paths, not just happy paths — the authz model depends on it (`requireApprovedAuth`, admin tiers).

## Coverage expectations

- New route → new/extended suite in `apps/api/src/tests/`; new web lib → jsdom test alongside; new Zod schema → contract test in `packages/core`.
- Known gap (on purpose until P4): `packages/ui` has no `test` task — don't add UI tests Turbo expects; coordinate first (ROADMAP.md).
- Browser/e2e testing is the big gap; before adding Playwright, read `docs/testing.md` harness notes and pick the auth setup used by `e2e` (same-origin vs split).
