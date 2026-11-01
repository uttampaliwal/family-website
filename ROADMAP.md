# Roadmap

Authoritative plan: **`docs/roadmap.md`** (milestones M1–M13 shipped; P0–P3 hardening merged, see `CHANGELOG.md`). This file tracks open engineering follow-ups, factually.

## Open items (2026-11 snapshot)

- [ ] **Public-launch SEO decision**: `apps/web/index.html` ships `noindex,nofollow` while `sitemap.xml`/canonical exist — pick one stance before/at launch.
- [ ] **P4 line**: browser e2e (Playwright) — first planned as `v0.4.2` in `docs/git-workflow.md`.
- [ ] Add `eslint-plugin-react-hooks` + `jsx-a11y` plugins (config referenced as missing in docs; a11y roadmap item depends on it).
- [ ] `packages/ui`: add a `test` script (Turbo "test everywhere" currently has a hole) and, when doing so, wire `turbo.json` accordingly.
- [ ] `zod` major upgrade (Dependabot runtime-group PR): `packages/core` consumers + `apps/api/src/config/env.ts`, `middleware/error.ts`, `scripts/migrate-roles.ts` use `ZodError.errors` / old overload shapes — needs a dedicated migration PR against the new API (CI currently red on that PR only).
- [ ] Dependabot grouping policy: major bumps (e.g. `typescript@7`, `zod@4`) break gates; consider `ignore` for majors or separate minor-patch/major groups so minor/patch PRs go green regardless.
- [ ] CHANGELOG automation: generate entries from mixed-commit history (or keep-a-changelog PR template) so `v0.4.x` drift doesn't recur.
- [ ] Root OG image + richer `useSeo` coverage; aria sweep over the 15 pages currently bare (see ARCHITECTURE.md debts).
- [x] `turbo.json` `globalDependencies: [".env"]` fixed → now watches `apps/api/.env.local` + `apps/web/.env.local`, the files the apps actually load (`lib/load-env.ts` cwd-relative dotenv + Vite).
- [ ] Confirm the stray AI-Studio artifact `metadata.json` removal is complete (deleted in the baseline cleanup — historical copies remain in git history only).
