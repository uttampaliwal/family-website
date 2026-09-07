# Kulaya — The Family Nest

> कुल + आलय — "the family's nest."

A private, modern hub for one family — photos, events, documents, chat,
announcements, and the little moments in between. Built on a best-in-class
stack and designed to run on fully free tiers.

**Live features** — see [Roadmap](docs/roadmap.md) for history and plans.

- **Members & family tree** — profiles, parent relationships, generations
- **Photo gallery** — client-side WebP re-encode (≤2560px) before direct-to-R2 upload (up to 20 MB, private by default)
- **Events calendar** — monthly grid, yearly recurrence, RSVP-style notes
- **Announcements** — admin feed with email + in-app notification on publish
- **Documents** — private archive with revocable public share links
- **Moments** — family feed with likes and comments
- **Real-time chat** — rooms with SSE push
- **Notifications** — header bell, unread badges, live via SSE
- **Admin approvals** — new members must be vetted before entering
- **i18n** — English and हिन्दी; SEO metadata; code-split routes
- **3 themes × light/dark** — Warm Elegant / Minimal / Playful, FOUC-free

## Workspace

```
apps/
  web/    React 19 + Vite 7 + Tailwind v4 + react-router v7 (PWA)
  api/    Hono API (serverless-ready) + MongoDB via Mongoose
packages/
  core/   Shared Zod schemas & types (single source of truth)
  ui/     Design system: 3 themes × light/dark, Radix primitives
```

## Stack highlights

- **Monorepo**: pnpm 11 + Turborepo 2
- **Auth**: JWT in HttpOnly cookies, refresh rotation, CSRF double-submit
  protection, per-route rate limits, admin approval gate
- **Storage**: Cloudflare R2 presigned uploads (10 GB free); local-disk
  fallback in development
- **Real-time**: SSE (fetch-based reader — EventSource can't send headers)
- **Deploy target**: Vercel (web + API functions) + MongoDB Atlas M0 + R2 +
  Resend — see [docs/deployment.md](docs/deployment.md)

## Getting started

Requirements: Node 24.x (see `.nvmrc`), pnpm 11 (`corepack enable`).

```bash
pnpm install
cp apps/api/.env.example apps/api/.env.local   # fill in secrets (R2 optional)

# MongoDB — pick one:
docker compose up -d        # isolated Mongo 7 container (recommended)
# …or: mongod --dbpath ~/data/mongodb

pnpm dev                    # API :3000 (tsx watch), web :5173 (proxied)
```

Open <http://localhost:5173>. First run:

1. Register an account (anyone can request to join).
2. Seed an admin, then approve yourself (or have the admin do it):

   ```bash
   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=<strong-password> \
     pnpm --filter @family/api seed-admin
   ```

3. Sign in — `/health` shows database connectivity.

## Project docs

| Doc                                                            | Contents                                           |
| -------------------------------------------------------------- | -------------------------------------------------- |
| [docs/architecture.md](docs/architecture.md)                   | System design, request flow, auth & security model |
| [docs/deployment.md](docs/deployment.md)                       | Free-tier deployment: Atlas, R2, Vercel, Resend    |
| [docs/environment-variables.md](docs/environment-variables.md) | Every env var, where it's used, prod values        |
| [docs/testing.md](docs/testing.md)                             | Test commands, conventions, how to add tests       |
| [docs/roadmap.md](docs/roadmap.md)                             | Shipped milestones and planned work                |
| [docs/threat-model.md](docs/threat-model.md)                   | Attacker types, assets, trust boundaries, abuse    |
| [docs/data-lifecycle.md](docs/data-lifecycle.md)               | Retention, deletion, export, backups, recovery     |
| [docs/git-workflow.md](docs/git-workflow.md)                   | Branching, milestones, versioning & tags           |
| [CONTRIBUTING.md](CONTRIBUTING.md)                             | Setup, conventions, PR checklist                   |
| [SECURITY.md](SECURITY.md)                                     | Security model and reporting                       |

## Quality gates

```bash
pnpm lint        # ESLint (flat config, shared)
pnpm typecheck   # strict TS across all packages
pnpm test        # Vitest (API + web)
pnpm build       # Turbo pipeline
```

CI runs all four on every push/PR via GitHub Actions. Keep the four green
before opening a PR.

## Environment

Each app reads its own `.env.local` (gitignored). `apps/api/.env.example` is
the canonical API reference; the full matrix lives in
[docs/environment-variables.md](docs/environment-variables.md).
Never commit real secrets.
