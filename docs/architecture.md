# Kulaya — Architecture

## System overview

Single **Vercel project** serves both the web app and the API. The API runs
as a Node serverless function mounted under `/api` (`apps/web/api/index.ts`),
so the whole site is **same-origin**: session cookies
(`SameSite=Lax`), the CSRF cookie, and the Vite dev proxy behaviour all match
between local development and production.

```
 Browser ──> Vercel edge ──> /        → Vite static build (apps/web)
                            /api/*   → Hono serverless function (apps/api)
                                        │
                                        ├─ MongoDB Atlas M0 (Mongoose)
                                        ├─ Cloudflare R2 (photos, documents)
                                        └─ Resend (transactional email)
```

## Monorepo layout

- **`packages/core`** — source of truth for shared contracts. Every Zod schema
  (`*RequestSchema`, `*ResponseSchema`) and inferred type is defined here and
  re-exported from `index.ts`. Both the API (validation) and the web app
  (types) import from it, so a schema change is immediately caught by
  `pnpm typecheck`.
- **`packages/ui`** — the design system (3 themes × light/dark) and Radix
  primitives (avatar, dropdown, toast, tabs, switch, skeleton…).
- **`apps/api`** — Hono application + Mongoose models + tests.
- **`apps/web`** — React SPA (PWA), lazy-loaded routes, TanStack Query,
  Zustand auth store, the `@family/ui` design system.

## API design

### Request pipeline

`createApp()` in `apps/api/src/app.ts` wires, in order:

1. `requestId()` + structured request logging (pino via `lib/logger`).
2. Security headers, CORS (only `WEB_ORIGIN`), origin check for state-changing
   requests.
3. Routes, grouped by domain; each route file applies its own guards:
   `requireAuth` (JWT bearer / cookie session), `requireAdmin`,
   `requireApprovedMember` (re-checks live `adminApprovalStatus`), and
   per-route rate limits.
4. `validateBody` / `zValidator` — Zod schemas from `@family/core`.
5. Central error handler (`middleware/error`) — maps `AppError` codes to four
   clean HTTP responses; unexpected errors are logged and masked in production.

### Auth & security model

- **Access token** lives in an HttpOnly cookie; the client keeps a copy for the
  SSE streams (`Authorization: Bearer`).
- **Refresh**: rotating refresh token, `JTI` stored server-side; logging in on
  a new device can rotate idle sessions elsewhere (`AUTH_MAX_ACTIVE_SESSIONS`).
- **CSRF**: double-submit `kulaya_csrf` cookie; state-changing requests must
  echo the token in `X-CSRF-Token`. GET/HEAD are exempt.
- **Approval gate**: accounts start `pending`; `requireApprovedMember` re-checks
  the live status on every request (not just login), so revoking access is
  immediate.
- **Rate limiting**: login (8/min), register (6/15 min), verify/reset
  (10/15 min), general auth (60/min). In-memory — resets per serverless
  instance (fine for a family site; see deployment notes).

### Models (`apps/api/src/models`)

| Model                | Purpose                                                     |
| -------------------- | ----------------------------------------------------------- |
| `User`               | Auth, profile, role (user/admin), approval status, sessions |
| `Announcement`       | Admin broadcast posts                                       |
| `Event`              | Calendar entries with recurrence                            |
| `Post`               | "Moments" feed; likes + nested comments                     |
| `Room` / `Message`   | Real-time chat                                              |
| `Photo` / `Document` | Object metadata (R2 keys, sizes, mime)                      |
| `Notification`       | Per-recipient in-app notifications                          |

### Real-time (SSE)

Chat and notifications both use **fetch-based SSE** (`web/src/lib/sse.ts`):
`EventSource` cannot send `Authorization` headers, so the browser reads the
stream manually with a Bearer token and re-fetches history on reconnect.

- `api/src/lib/sse.ts` — in-memory pub/sub; chat is a global fan-out,
  notifications are **per-recipient channels**.
- Keepalive pings every 25 s; the client treats history refetch as the source
  of truth, so missed frames self-heal.

### Storage

`api/src/lib/storage.ts` defines a `StorageBackend` interface with two
implementations: **R2** (S3-compatible presigned URLs, production) and
**local disk** (`apps/api/uploads/`, development). The browser PUTs/GETs
objects directly; the API confirms size/type after upload and never proxies
file bytes. Keys are namespaced `photos/` and `documents/`, and path traversal
is rejected at the boundary.

## Dependency flow

```
packages/core ──> packages/ui ──> apps/web
      └───────> apps/api
```

`core` has zero internal dependencies; `ui` depends only on `core`; apps
depend on both packages. Never let an app import another app, and never let
`core` depend on an app package.

## Done conventions

- **Realtime logic** lives next to the route that needs it (see `chat.ts`,
  `notifications.ts`); SSE helpers stay in `lib/` to avoid circular imports.
- **Contracts change**: alter the `@family/core` schema first, then the API
  route, then the web consumer — typecheck is your safety net.
- **New endpoints get a route, a validation schema, and a test** — see
  [docs/testing.md](docs/testing.md).
