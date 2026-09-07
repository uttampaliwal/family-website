# P0 Baseline — Security Inventory (v1.0 Go-Live Plan)

Date: 2026-09-07. Commit: branch `feat/p0-baseline` off `main@4c6c898`.
Runtime verified: **Node v24.20.0**, pnpm 11.20.0. All four gates green on Node 24
(see §1). This document is the evidence-producing P0 baseline: endpoint
authorization contract, dependency/env audit, client-storage audit, and the
no-secrets-in-logs audit. Gaps marked **[GAP → P1]** are the P1 work items.

## 1. Quality-gate baseline (Node 24)

| Gate                                                      | Result                                                                                                                                                                                                                                             |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck` (4 packages)                             | ✅ pass                                                                                                                                                                                                                                            |
| `pnpm lint` (4 packages)                                  | ✅ pass                                                                                                                                                                                                                                            |
| `pnpm build` (web PWA precache 48 entries / 760 KiB, API) | ✅ pass                                                                                                                                                                                                                                            |
| `pnpm test`                                               | ✅ **187/187 API tests pass** (16 files) + core/ui/web green                                                                                                                                                                                       |
| `pnpm audit`                                              | ⚠️ **5 high**: `nanoid <3.3.18` (1, via build chain), `fast-uri` 3.0.0–3.1.6 (4, via `vite-plugin-pwa > workbox-build > ajv`) — all transitive build-time deps, no runtime auth/data path. Tracked; pre-Go-Live requirement is zero high/critical. |

Test census (actual `it/test` counts, docs saying "125/130+" are stale → fix in P8):
api auth 15, members 11, tree 9, photos 10, events 14, announcements 13,
documents 14, posts 13, chat 10, search 9, nl-search 15, natural-search 8,
notifications 14, permissions 18, audit-logs 12, health 2 = **187**; core auth
schemas 6. Total ≈ **193**.

Lockfile: `pnpm-lock.yaml` sha256 `0e25e97a…` (full hash in git). No lockfile
change in P0.

## 2. Endpoint authorization contract

Legend: AUTH = bearer required; APPROVAL = `adminApprovalStatus === "approved"`
rechecked; CAP = capability/role check; CSRF = double-submit on mutations;
RATE = per-route limiter. **[GAP → P1]** = must be closed by central
`requireApprovedAuth` + `authVersion` + session-family work.

| Method + Path                           | AUTH                        | APPROVAL                                                                                                          | CAP                                      | CSRF        | RATE                        | Notes                                                                                                |
| --------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------- | --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `GET /api/health-check`                 | —                           | —                                                                                                                 | —                                        | —           | —                           | Single route mixes liveness + live DB ping, always 200 → split `/live` + cached `/ready` in P2       |
| `POST /api/auth/register`               | —                           | —                                                                                                                 | —                                        | origin only | general                     | Open registration (intentional v1 decision) + hardening in P1/P2                                     |
| `POST /api/auth/login`                  | —                           | checked inline (pending/rejected refused)                                                                         | —                                        | origin only | auth-strict                 | —                                                                                                    |
| `POST /api/auth/refresh`                | cookie                      | **[GAP → P1]** no `isVerified`/approval check; JTI-membership only (`auth.ts:229-262`)                            | —                                        | ✅          | general                     | Rejected member can mint new access tokens. Fix: approval check + session-family + ≤10s replay       |
| `POST /api/auth/logout`                 | cookie                      | —                                                                                                                 | —                                        | ✅          | —                           | Must invalidate current + previous JTI (P1 test)                                                     |
| `GET /api/auth/me`                      | ✅                          | **[GAP → P1]** no approval recheck                                                                                | —                                        | —           | —                           | —                                                                                                    |
| verify-email / forgot / reset           | token                       | —                                                                                                                 | —                                        | —           | general                     | P2: move tokens to fragment + POST                                                                   |
| `GET /api/members`, `/tree`, `/:id`     | ✅                          | **[GAP → P1]** `members.ts:13` = `originCheck, requireAuth` only; no approval gate                                | —                                        | —           | —                           | Only content router without `requireApprovedMember`                                                  |
| `PATCH /api/members/me`                 | ✅                          | **[GAP → P1]** same as above                                                                                      | —                                        | ✅          | —                           | —                                                                                                    |
| `/api/admin/*` (members, tree, audit)   | ✅ via cap                  | **[GAP → P1]** `requireCapability` checks `role` only (`security.ts:43-56`); `admin.ts` mounts `originCheck` only | `manageMembers`/`manageTree`/`viewAudit` | ✅          | —                           | Reject-without-demote keeps admin power (`admin.ts:138-164` keeps old role unless explicitly passed) |
| `/api/photos/*`                         | ✅                          | ✅ (local copy)                                                                                                   | `uploadPhotos` on mutations              | ✅          | upload-limited              | 1 of 7 duplicated `requireApprovedMember` copies → centralize in P1                                  |
| `/api/documents/*` incl `/:id/download` | ✅ bearer-only              | ✅ (local copy)                                                                                                   | `uploadDocuments` on mutations           | ✅          | upload-limited              | Bare `<a href>` download 401s in browsers → P2 button→signed-URL flow; URL TTL 60m → 5–15m           |
| `/api/events/*`                         | ✅                          | ✅ (local copy)                                                                                                   | `createEvents` on mutations              | ✅          | —                           | —                                                                                                    |
| `/api/announcements/*`                  | ✅                          | ✅ (local copy)                                                                                                   | `publishAnnouncements` on mutations      | ✅          | —                           | —                                                                                                    |
| `/api/posts/*`                          | ✅                          | ✅ (local copy)                                                                                                   | `createMoments`/`comment`                | ✅          | **[GAP → P2]** needs limits | Likes use read-modify-save → `$addToSet/$pull` in P2                                                 |
| `/api/chat/*`                           | ✅                          | ✅ (local copy)                                                                                                   | `chat` + `createRooms`                   | ✅          | message-limited             | Read-state two-op push → `RoomReadState` upsert in P2                                                |
| `/api/search/*` (incl NL)               | ✅                          | ✅ (local copy)                                                                                                   | —                                        | —           | search-limited              | —                                                                                                    |
| `/api/notifications/*`                  | ✅                          | ✅ (local copy)                                                                                                   | —                                        | ✅          | **[GAP → P2]** needs limits | —                                                                                                    |
| `/api/shared/:token`                    | public bearer (share token) | n/a (revocation-checked)                                                                                          | —                                        | —           | —                           | Revoke doesn't kill issued R2 URLs until expiry → document + shorten TTL                             |

Cross-cutting gaps: **no JSON body-size limit** (`app.ts` has `secureHeaders` + `cors` only → P1 ~1MB limit); register/login/refresh/verify/reset rate limits exist at `AUTH_RATE` levels but need P1 review; uploads/posts/comments/likes/shares/notifications/profile/admin need P2 limits.

## 3. Environment / storage audit

- `R2_*` all `.optional()`, no production-only branch (`env.ts:33-38`); `createStorage()` picks `LocalStorage` on absence alone (`storage.ts:152-160`) — **silent local-disk fallback in prod [GAP → P1]**: fail closed when `NODE_ENV=production`. (On Vercel local disk is ephemeral per-invocation, so this corrupts uploads, not just weakens them.)
- Only prod-required var today: `DATABASE_URL`. P1 requires `AUTH_*_SECRET` (non-default), `R2 ×4`, `WEB_ORIGIN` https, `EMAIL_FROM`.
- No `vercel.json`; Vercel runtime is dashboard-set → set Node 24 + document in deployment pass.

## 4. Client storage / offline audit (locks online-first decision)

- `kulaya.session` in `localStorage` holds **access JWT + user** (`auth-store.ts:39-57`); offline boot restores stale session + serves cached family data. **P1 removes**: access JWT memory-only, refresh-cookie reload, legacy key wipe, offline = shell + retry + drafts.
- SW (Workbox, `generateSW`, 48 precache entries) caches app shell; P1/P2 verifies no authenticated family API payloads are served stale offline.

## 5. Data-model audit (new P1 fields confirmed absent)

`User.adminApprovalStatus`: `pending | approved | rejected` only — no `suspended`, no `authVersion` anywhere. P1 adds both; security-state changes (reject/suspend/role/password/email/delete) must move membership + `authVersion` + session revocation together or fail closed.

## 6. No-secrets-in-logs audit

- Current state clean: `requestLogger` logs `method/path/status/durationMs` only; `errorHandler` logs `{ err }` on 500s (AppError message paths return codes, not tokens). No `Authorization` header, JWT, share-token or presigned-URL logging found.
- P0 guardrail added: pino `redact` list in `apps/api/src/lib/logger.ts` (authorization/tokens/URLs/passwords → `[REDACTED]`), protecting the new P1/P2 surfaces (refresh diagnostics, email retries, reconciliation) where ad-hoc debug logging is the usual leak vector. Standing rule: never `JSON.stringify` request objects into logs.

## 7. Node 24 pin (done in P0)

`package.json` engines `24.x`, CI `node-version: 24`, new `.nvmrc` (`24`),
README + CONTRIBUTING updated. Vercel dashboard runtime → 24 (deployment pass).
Local dev verified on v24.20.0 this run.

## 8. Version policy (done in P0)

`docs/git-workflow.md` amended: `v0.4.x` pre-1.0 hardening line ratified
(`v0.4.0` security → `v0.4.1` durability → `v0.4.2` E2E/deploy → `v1.0.0`),
then normal SemVer resumes. CONTRIBUTING cross-references it.
