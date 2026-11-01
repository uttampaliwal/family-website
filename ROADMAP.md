# Roadmap

Authoritative plan: **`docs/roadmap.md`** (milestones M1–M13 shipped; P0–P3 hardening merged, see `CHANGELOG.md`). This file tracks open engineering follow-ups, factually.

## Open items (2026-11 snapshot)

- [ ] **Public-launch SEO decision**: `apps/web/index.html` ships `noindex,nofollow` while `sitemap.xml`/canonical exist — pick one stance before/at launch.
- [ ] **P4 line**: browser e2e (Playwright) — first planned as `v0.4.2` in `docs/git-workflow.md`.
- [ ] Add `eslint-plugin-react-hooks` + `jsx-a11y` plugins (config referenced as missing in docs; a11y roadmap item depends on it).
- [ ] `packages/ui`: add a `test` script (Turbo "test everywhere" currently has a hole) and, when doing so, wire `turbo.json` accordingly.
- [ ] CHANGELOG automation: generate entries from mixed-commit history (or keep-a-changelog PR template) so `v0.4.x` drift doesn't recur.
- [ ] Root OG image + richer `useSeo` coverage; aria sweep over the 15 pages currently bare (see ARCHITECTURE.md debts).
- [ ] `turbo.json` `globalDependencies: [".env"]` → switch to `.env.local` (apps' actual convention) or drop the key.
- [ ] Confirm the stray AI-Studio artifact `metadata.json` removal is complete (deleted in the baseline cleanup — historical copies remain in git history only).
