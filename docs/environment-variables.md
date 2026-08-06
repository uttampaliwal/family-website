# Environment variables

Apps read `.env.local` files (gitignored). The **API** validates its env at
startup with Zod (`apps/api/src/config/env.ts`) and **fails fast** with a
clear message when a required value is missing or malformed. The **web app**
reads Vite build-time variables only (`VITE_*`).

Canonical templates: `.env.example` (root, overview) and
`apps/api/.env.example` (API copy-to-file).

## API — `apps/api/.env.local`

| Variable                    | Required  | Default                                   | Notes                                                                                    |
| --------------------------- | --------- | ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| `PORT`                      | no        | `3000`                                    | Dev only; Vercel sets its own.                                                           |
| `NODE_ENV`                  | no        | `development`                             | `development` / `production` / `test`.                                                   |
| `LOG_LEVEL`                 | no        | `info`                                    | pino level: `fatal`…`trace`.                                                             |
| `DATABASE_URL`              | prod: yes | `mongodb://localhost:27017/family-portal` | Dev defaults to local Mongo; **production refuses to start without it**.                 |
| `WEB_ORIGIN`                | no        | `http://localhost:5173`                   | Comma-separated allowed origins (CORS + origin check). Keep exact — no trailing slashes. |
| `AUTH_ACCESS_TOKEN_SECRET`  | **yes**   | —                                         | ≥ 32 chars. Generate: `openssl rand -base64 48`.                                         |
| `AUTH_REFRESH_TOKEN_SECRET` | **yes**   | —                                         | ≥ 32 chars, different from the access secret.                                            |
| `AUTH_ACCESS_TOKEN_TTL`     | no        | `15m`                                     | `ms`-parseable duration.                                                                 |
| `AUTH_REFRESH_TOKEN_TTL`    | no        | `30d`                                     | `ms`-parseable duration.                                                                 |
| `AUTH_MAX_ACTIVE_SESSIONS`  | no        | `5`                                       | 1–20; oldest sessions rotate out.                                                        |
| `RESEND_API_KEY`            | no        | —                                         | Absent → emails are logged instead of sent (dev).                                        |
| `EMAIL_FROM`                | no        | `Kulaya <noreply@kulaya.family>`          | Verify the domain in Resend for deliverability.                                          |
| `R2_ACCOUNT_ID`             | no        | —                                         | Set **all four** R2 vars together.                                                       |
| `R2_ACCESS_KEY_ID`          | no        | —                                         | R2 API token (Object Read & Write).                                                      |
| `R2_SECRET_ACCESS_KEY`      | no        | —                                         | R2 API token secret.                                                                     |
| `R2_BUCKET`                 | no        | `kulaya-photos`                           | Must exist and be private.                                                               |
| `ADMIN_EMAIL`               | no        | —                                         | Used only by `pnpm --filter @family/api seed-admin`.                                     |
| `ADMIN_PASSWORD`            | no        | —                                         | Used only by `pnpm --filter @family/api seed-admin`.                                     |

Rules:

- Changing an `AUTH_*` secret invalidates every session — rotate deliberately.
- `DATABASE_URL` in production must point at the Atlas M0 (or equivalent)
  cluster; never a local path.
- `WEB_ORIGIN` must match the deployed origin exactly (including `https://`);
  a mismatch breaks cookies/session with confusing `403`/CSRF errors.

## Web — `apps/web/.env.local`

| Variable            | Required | Default | Notes                                                                             |
| ------------------- | -------- | ------- | --------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | no       | `/api`  | Absolute URL only when the API is hosted separately (see deployment.md SSE note). |

The web app has no secrets — everything sensitive lives server-side.

## Vercel production

Put the same variables (with production values) under
**Settings → Environment Variables** in the Vercel project; set them for
Preview as well so PR deployments behave identically. See
[docs/deployment.md](docs/deployment.md) for the full walkthrough.

## Troubleshooting

- **Startup aborts with "Environment validation failed"** — the missing
  variable is named in the error; check it's set in the right file
  (`apps/api/.env.local` locally, Vercel UI in prod).
- **Secrets in git?** — never. `.env*` is gitignored except the templates.
  If something slips through, rotate it and remove it from history.
