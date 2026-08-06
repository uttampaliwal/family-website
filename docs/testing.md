# Testing

Vitest powers both workspaces. Run everything from the repo root:

```bash
pnpm test            # API + web (or `pnpm --filter @family/api test`)
```

CI runs the full suite on every push/PR (`pnpm test`).

## What's covered

**API** (`apps/api/src/tests/*.test.ts`) — the strongest coverage: 125 tests
today, end-to-end requests against a throwaway in-memory MongoDB
(`mongodb-memory-server`). Each file:

1. Boots a fresh `MongoMemoryServer` + `createApp()` in `beforeAll`.
2. Primes the CSRF cookie via `GET /api/auth/csrf-token`.
3. Creates real users / admins (via `User.create` + `hashPassword`), signs in
   to get a Bearer token, and drives the HTTP surface exactly like the web app.

Covered so far: auth & CSRF, members & tree, photos, events, announcements,
documents, posts, chat, and notifications.

**Web** (`apps/web/src/components/*.test.tsx`) — component-level smoke tests
(currently the `Button` design-system primitive).

## Conventions for new API tests

Copy the harness from an existing file (e.g. `events.test.ts` or
`notifications.test.ts`) — the helpers are duplicated per file by design so a
new domain's test is self-contained:

```ts
const cookies: Record<string, string> = {}; // login/CSRF cookie jar
function headers(token?: string) {
  /* Cookie + CSRF + optional Bearer */
}
async function createUser(name, overrides); // approved by default
async function signInAs(userId): Promise<Session>;
```

Rules:

- **Approval-aware**: `requireApprovedMember` re-checks live status. When a
  test needs an unapproved caller, sign in first, _then_ flip
  `adminApprovalStatus` in the DB (login itself rejects pending accounts).
- **Each route spec asserts its own access control** (401/403) before
  behaviour — keep it that way for new endpoints.
- **Don't share memory-mongo state across files** — every file gets its own
  in-memory database.
- Prefer `app.request()` (no sockets/steps) over spinning a server.
- Keep tests assertive but independent; ordering within a `describe` should
  not matter.

## Adding a feature

1. Schema first: `packages/core/src/schemas/<domain>.ts` + re-export.
2. Route + `validateBody`/`zValidator` in `apps/api/src/routes/`.
3. Test file mirroring the domain (see above).
4. Web consumer + typecheck — the whole loop is green.

## Verification checklist

```bash
pnpm typecheck   # strict across core/ui/web/api
pnpm lint        # flat config
pnpm test        # all suites
pnpm build       # turbo pipeline
```

Then open the PR; CI runs the same four.
