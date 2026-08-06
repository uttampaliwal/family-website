# Contributing

Thanks for helping build Kulaya. This is a private family project, but the
conventions below keep it healthy for whoever touches the code next.

## Getting started

Requirements: Node ≥ 20, pnpm 11 (`corepack enable`), MongoDB
(we ship `docker compose up -d`).

See [README.md](README.md) → "Getting started" for first-run steps.

## Branch & commit conventions

Follow [docs/git-workflow.md](docs/git-workflow.md) closely:

- Feature branches off `main`: `feat/m<M>‑<name>` (e.g. `feat/m4-family-tree`),
  merged via pull request, then deleted.
- One concern per commit; messages concise, imperative, with a short body
  when useful.
- Milestones get a PATCH tag (`v0.3.x`) after merge.
- If a branch is more than a week old, rebase on `main` before merging.

## Working on a milestone

1. Say what you're building first — a PR name, a one-liner plan. (For the
   solo maintainer that's the todo list; for a friend, a short issue.)
2. **Contract-first**: change `packages/core/src/schemas/<domain>.ts` before
   touching routes or UI, then re-export from `index.ts`.
3. Backend: route + validation + tests (see [docs/testing.md](docs/testing.md)).
4. Frontend: consume the core types; keep UI copy in
   `apps/web/src/i18n/translations.ts` for both EN and HI.
5. Update `docs/roadmap.md` when the milestone is shipped.

## Quality gates (must pass before pushing)

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

CI (`.github/workflows/ci.yml`) runs the same four. Fix locally, never
"push and pray". Run `pnpm format` before committing to keep Prettier happy.

## Pull request checklist

- [ ] Branch off latest `main`, no merge commits in the branch.
- [ ] Four quality gates green locally _and_ in CI.
- [ ] New API surface has test coverage (access-control negative cases too).
- [ ] Both `en` and `hi` translations added when you touched copy.
- [ ] Schema change → `packages/core` re-exported; no drift vs typecheck.
- [ ] Docs touched when behaviour changed (`docs/*`, README, CHANGELOG).
- [ ] No secrets, no generated files, no lockfile noise.

## Code style

- TypeScript strict; imports sorted via Prettier plugin.
- No unused variables (`^_` prefix allowed for deliberate skips).
- Keep components small; heavy UI in `packages/ui`, domain logic in the app.
- Favor explicit `else`-free guards; throw `AppError(code, message)` in the
  API, let the central handler map it to HTTP.
