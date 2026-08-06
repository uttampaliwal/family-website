# Kulaya — Threat Model

> Private family hub — photos, events, documents, chat, announcements.

This document complements [architecture.md](architecture.md) and
[SECURITY.md](../SECURITY.md): while those describe _what is built_, this one
describes _who could attack it, what they want, and how the system holds up_.
Its scope is the deployed system (Vercel + Atlas + R2 + Resend); the models in
`apps/api/src/models/*` and the guards in `apps/api/src/routes/*` are the
concrete surface this analysis covers.

## Risk posture

Kulaya is a **private, family-scale** system. We assume casual attackers,
invited guests who misbehave, and opportunists — **not nation-states**. That is
not license to be sloppy: personal data (photos, documents, family details)
needs more care than a public blog, and the platform already avoids the
classic OWASP Top-10 categories. The residual risks we deliberately accept are
listed in [Accepted risks](#accepted-risks).

## Assets

| Asset                                                                                      | Sensitivity | Where it lives                           |
| ------------------------------------------------------------------------------------------ | ----------- | ---------------------------------------- |
| **Member PII** — name, email, phone, date of birth, gender, kinship, parent links          | High        | MongoDB (`User`)                         |
| **Photos** (private by default)                                                            | High        | R2 (`photos/*`) + `Photo` metadata       |
| **Documents** (family archive)                                                             | High        | R2 (`documents/*`) + `Document` metadata |
| **Moments posts, likes, comments**                                                         | Medium      | `Post`                                   |
| **Chat messages**                                                                          | Medium      | `Message` / `Room`                       |
| **Events/anniversaries**                                                                   | Medium      | `Event`                                  |
| **Announcements & notifications**                                                          | Low–Medium  | `Announcement` / `Notification`          |
| **Credentials** — password hashes, refresh-token JTI hashes, pending password/email tokens | High        | `User` + env secrets                     |
| **Secrets** — `AUTH_*`, `RESEND_API_KEY`, R2 keys/token, `DATABASE_URL`, admin password    | Critical    | Env (Vercel / `.env*`); never in git     |
| **Brand/availability** — the family's one place                                            | Low-Medium  | Vercel, Atlas M0, R2, Resend free tiers  |

## Attacker types

Ranked by likelihood for this system, not by capability.

1. **Opportunistic scanner / internet bot** — probes for misconfig, open
   endpoints, exposed admin, dependency CVEs. No target knowledge.
2. **Casual outsider with a valid share link** (document recipient) — maybe
   pokes at the link, tries to guess more, or forwards the document.
3. **Curious / mischievous family member** — an _approved insider_. The real
   threat on a family site: reads what they shouldn't, edits someone's post,
   deletes uploads, spams, or shares content externally.
4. **Invited guest gone astray** — someone outside the family handed a link or
   an account; forgets the "private" part.
5. **Phish/credential-stuffing opportunist** — tries the login/forgot flows and
   common reused passwords against family emails.
6. **Persistent outsider targeting this family** — interest-driven (e.g. a
   document contains something sensitive). Rare; we rate this as an accepted,
   low-probability higher-impact case.
7. **Supply-chain / dependency** — compromised npm package or lockfile drift.

We treat 3–4 as the dominant risk drivers and size mitigations accordingly.

## Trust boundaries

```
  [External internet / browser]
        │  TLS (HTTPS only in prod; HSTS)
        ▼
┌─────────────────────────────────────────────┐   AUTH-BOUNDARY
│ Vercel edge — same-origin site + API        │   cookies, CSRF,
│    web (static)      api (Hono Fn)          │   origin/CORS allowlist
└──────────┬─────────────────┬────────────────┘
           │ Mongoose         │ presigned URLs (1 h)
           ▼                  ▼
        MongoDB Atlas       Cloudflare R2     DATA-BOUNDARY
           │                  │
           └──── Resend (email, auth-bound) ──┘
   ⚠ public surface: /api/shared/documents/:token  (document share links)
```

Boundaries and their controls

| Boundary          | Trust decision                                                                 | Enforced by                                                                     |
| ----------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Internet → app    | Anyone may reach the login/register/share endpoints; nothing else              | Route-level `requireAuth`/`requireAdmin`/`requireApprovedMember`, `originCheck` |
| Web app → API     | Same-origin; the app only forwards what the API itself requested and validated | JWT in HttpOnly/Bearer + double-submit CSRF + `SameSite=Lax`                    |
| API → Mongo / R2  | Fully trusted; leak here = total compromise                                    | Secrets in env only; least-privilege IAM keys; private bucket                   |
| API → Resend      | Trusted mailer                                                                 | `RESEND_API_KEY` in env                                                         |
| Public share link | Only a 24-byte token + no auth — the one designed public surface               | High-entropy token, revocable, per-IP rate limit                                |
| Admin functions   | Admin account only                                                             | `requireAdmin`, live `adminApprovalStatus` re-check on approval                 |

## Threat & abuse cases

Each row: the scenario, what it exploits, existing mitigation, and residual
risk. Threat identifiers are stable for referencing in issues/tests.

| ID   | Scenario / abuse                                                                         | Exploits                                                                                   | Mitigations in place                                                                                                                                                                                                                   | Residual risk                                                                  |
| ---- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| T-1  | **Account takeover via credential stuffing**                                             | Login + `/forgot-password` + `/reset-password`                                             | Rate limits (login 8/60s, forgot 5/15m), bcrypt hashing at cost 12 (`lib/passwords.ts`), no account-existence leak on forgot flows                                                                                                     | Some (password reuse at family scale); accept                                  |
| T-2  | **Account enumeration**                                                                  | `/check-username` reveals availability by design; login/register disclose registered email | Deliberate: register+forgot are non-revealing; `/check-username` leaks **username** only, a self-chosen nickname                                                                                                                       | Low                                                                            |
| T-3  | **Registration abuse / spam-joins**                                                      | Open `/register` + auto-email                                                              | Email verification, admin-review gate (approval) before any data access, register rate limit 6/15m, `member_joined` admin notification                                                                                                 | Low                                                                            |
| T-4  | **Forge account to access data** — register, verify a throwaway email, wait for approval | Family trust gate                                                                          | Admin manually approves each member; `requireApprovedMember` re-checks live status on every protected request                                                                                                                          | Low                                                                            |
| T-5  | **Cross-site request forgery**                                                           | State-changing API calls from another origin                                               | HMAC-signed double-submit `kulaya_csrf` (signature defeats cookie fixation, constant-time echo check); `SameSite=Lax` refresh cookie, `originCheck` for mutating methods, same-origin deployment; `X-CSRF-Token` in the CORS allowlist | Very low                                                                       |
| T-6  | **Session/refresh token theft & reuse**                                                  | Stolen cookie/token used to mint sessions                                                  | HttpOnly cookie, access TTL 15m, rotating refresh with server-side `JTI` hash, reuse → revoke **all** sessions, `AUTH_MAX_ACTIVE_SESSIONS` cap                                                                                         | Low (JWT in client memory for SSE; see Accepted)                               |
| T-7  | **Privilege escalation to admin**                                                        | Admin-only actions                                                                         | `requireAdmin` re-queries role server-side; `adminDecisionSchema` gates role change to `requireAdmin`; self-review blocked                                                                                                             | Low                                                                            |
| T-8  | **Broken access control — other people's documents/photos**                              | Direct object ids, `/download`, `DELETE`                                                   | Read view authorized for all approved members by design; **mutations** gated to owner-or-admin                                                                                                                                         | Low                                                                            |
| T-9  | **Public share-link guessing / brute force**                                             | Unauthorized reads of shared documents                                                     | `randomBytes(24)` (192-bit) token, not sequential IDs; IP rate limit on the public route                                                                                                                                               | Negligible                                                                     |
| T-10 | **Stored XSS via user content**                                                          | Posts, comments, captions                                                                  | React validates-escaped output; Zod input contracts; CSP (`script-src 'self'`)                                                                                                                                                         | Low                                                                            |
| T-11 | **Stored XSS via uploaded files**                                                        | Serving attacker-controlled HTML as a file/photo                                           | Upload gated to allowlist mime types (new keys), server `confirmUpload` rechecks Content-Type + size; downloads forced as `attachment` (`Content-Disposition`); private-by-default gallery                                             | Low                                                                            |
| T-12 | **Path traversal / arbitrary key in storage**                                            | Overwrite/read arbitrary R2/local objects                                                  | `uploadPathFor()` rejects any key not `photos/` or `documents/` and any `..`; upload URL generated server-side (random UUID key)                                                                                                       | Low                                                                            |
| T-13 | **Content moderation abuse (family member)**                                             | Delete others' posts/photos/documents, spam rooms, fake announcements                      | Owner-or-admin delete rule; admin can revoke members/deactivate; roles server-side                                                                                                                                                     | Medium (insider acting nastily — needs admin intervention; no per-object ACLs) |
| T-14 | **Data exfiltration via API mass-read**                                                  | Pull all members' PII, all documents at once                                               | Member reads return only public profile fields (`toMemberPayload`); documents/photos lists capped at 100; general auth rate limit                                                                                                      | Low                                                                            |
| T-15 | **Email flood / share-spam**                                                             | Forgot-password/resend abuse                                                               | Rate limits, single token per flow, short expiry (24h verify, 1h reset), non-revealing responses                                                                                                                                       | Low                                                                            |
| T-16 | **Mongo/R2/Resend key leak**                                                             | Environment keys, `.env.local` / CI                                                        | `.env*` gitignored, secrets never in source; `env.ts` fails fast if `AUTH_*` < 32 chars; rotation doc in SECURITY                                                                                                                      | Low                                                                            |
| T-17 | **Supply-chain (npm)**                                                                   | Malicious untrusted dependency                                                             | pnpm-lock committed, PR review checklist (CONTRIBUTING), CI runs tests                                                                                                                                                                 | Medium                                                                         |
| T-18 | **DoS of free-tier / rate-limit bypass**                                                 | Hammer `/login`, SSE keepalive, unauthenticated shared links                               | In-memory rate limits (per-serverless-instance), request logger; no authed unbounded endpoints                                                                                                                                         | Medium on Atlas/Resend free quotas; revisit if the family grows                |
| T-19 | **Man-in-the-middle**                                                                    | Read/change traffic                                                                        | TLS + HSTS on Vercel                                                                                                                                                                                                                   | Negligible                                                                     |

## Attack trees (top 3)

For the highest-likelihood attacks, the path an attacker walks vs. the doors
we lock.

### A) "I want everyone's photos"

```
 register → email verify (throwaway) → wait for admin approval
   ↑                                   │
 attacker needs a human gatekeeper     → approved member ⇒ album-wide read
                                        → photos:list (capped, 100/page)
                                        → documents:list + :id/download
 ⇒ Success requires one of the admins to approve a stranger.
```

### B) "I found a share link in email"

```
 link → token (192-bit, random) → brute force → ✗
   │                                └ rate limited + entropy space
   └ link forwarded to others (the *real* risk)
      → mitigations: revocable shareToken; each token is per-document
```

### C) "Steal an admin's session"

```
 phishing → admin types password on a fake origin → ✗ (no token, 403)
 XSS on the real site        → ✗ (React escapes, CSP script-src 'self')
 stolen device/cookie        → refresh reuse-detection revokes all sessions
```

## Entropy & strength notes

- Access JWT: HS256, `sub`/`jti`, 15m TTL.
- Refresh JWT: rotated every refresh; burden of a stolen refresh lasts the
  lifetime of the device cookie (30d max).
- Verification/reset token (`verify-email`, `reset-password`): 32-byte random,
  one with `hash + expires`, stored **hashed** (never plaintext at rest).
- Double-submit CSRF cookie: 24-byte random nonce + HMAC-SHA256 signature,
  rotated per login.

## Accepted risks (deliberate)

Kept in sync with [SECURITY.md](../SECURITY.md#known-trade-offs-accepted-deliberately)

1. **In-memory rate limits & SSE pub/sub** — reset per serverless instance; a
   well-resourced attacker could retry across instances. Fine at family scale.
2. **No 2FA** — the admin-approval and same-family circle is the compensating
   control; revisit as a milestone.
3. **No per-object ACLs** — every approved member reads every post/photo/doc
   (album-wide). This is the product definition, not an oversight.
4. **JWT kept in client memory for SSE** — the browser duplicates the access
   token into memory to send `Authorization` on the fetch stream; an XSS
   breakout would lift it anyway, but we accept the extra copy.
5. **`/check-username`** — a deliberate, cheap availability oracle, but for
   self-chosen usernames only, never emails.

## Monitoring & detection

- Structured request logs (pino) — method, path, status, duration; never bodies or tokens.
- Admin notification on every **register** (`member_joined`) — the approval
  step made in that join is the human check of legitimacy.
- Errors from any unknown/unexpected handler produce a 500 masked body; the
  real stack goes to logs only.
- Consider adding (roadmap): failed-login alerting, a "who signed in from a
  new device" notification, and periodic dependency-audit in CI (existing
  workflow runs tests/lint/typecheck).

## Review cadence

- Re-run this analysis each time a new **boundary** is crossed (first public
  read API, new sharing surface, moving storage, adding roles beyond
  admin/user).
- The checklist in the deployment doc — along with the four quality gates in
  `README.md#quality-gates` — re-arms the threat model at deploy time.

## Summary

Kulaya treats the family as a **trusted but wary** setting. The two real
attack surfaces are identity (login → data) and the public share links. Both
are contained by server-side re-checks (approval status, role, token, CSRF) on
every request, high-entropy generated names and tokens, and a small
deliberately-public surface. The residual risks we carry are intentional:
no 2FA, no per-document ACLs, and in-memory rate limits — each with an explicit
owner to revisit if Kulaya grows beyond one family.
