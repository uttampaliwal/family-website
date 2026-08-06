# Git workflow & versioning (Kulaya)

## Branches

- **`main`** — the only long-lived branch. Always deployable, always green
  (CI must pass before merging).
- **`legacy`** — frozen snapshot of the pre-rewrite v0.2.x site. Never merged
  back. Also preserved by tags `legacy/current-work` and `legacy/v0.2.6-main`.
- **Feature branches** — short-lived, created off `main`:
  `feat/<milestone>-<name>` (e.g. `feat/m4-family-tree`). Merge via pull
  request, then delete. No `dev` branch: Vercel preview deployments on every
  PR play the staging role.

## Day-to-day loop

```bash
git checkout main
git pull                          # up to date before starting work
git switch -c feat/m4-family-tree # branch off main
# …work, commit as you go…
git push -u origin feat/m4-family-tree
# open PR → CI runs → merge → delete the branch
git switch main && git pull
git branch -d feat/m4-family-tree
```

## Versioning

SemVer: `MAJOR.MINOR.PATCH` — breaking change bumps MAJOR, new feature bumps
MINOR, bug fix bumps PATCH.

- The greenfield rewrite continues the legacy `v0.2.x` line as **v0.3.0**;
  packages are already versioned 0.3.0.
- Tag releases on `main` with `vX.Y.Z` (lightweight tag is fine for solo work):

```bash
git tag v0.3.0 && git push origin v0.3.0
```

- Milestone cadence: each completed milestone (M4, M5, …) that ships user
  value bumps MINOR; hotfixes bump PATCH.
- Existing `legacy/*` tags stay as permanent backups — never delete them.

## Rules of thumb

- Never force-push `main` (it is protected on GitHub).
- Never commit secrets (`.env*` files are gitignored; use `.env.local`).
- Keep commits small and descriptive; one concern per commit.
- If a branch is older than a week, rebase it on `main` before merging
  (`git switch feat/x && git rebase main`).
