# Security

Kulaya is a private family portal; the data in it is personal, so security is
treated as a feature. This document describes the model and how to report
issues.

## Security model (in brief)

Full details in [docs/architecture.md](docs/architecture.md).

- **Authentication**: JWT access token in an HttpOnly cookie; rotating
  refresh token with server-side `JTI` tracking; optional multi-device cap.
- **CSRF**: double-submit `kulaya_csrf` cookie on every state-changing
  request; same-origin deployment means `SameSite=Lax` is a second layer.
- **Authorization**: role checks (`user` / `admin`) and a live
  `adminApprovalStatus` gate re-checked on every protected request — pending
  or rejected accounts are blocked immediately, even with a valid token.
- **Transport**: HTTPS only in production; HSTS via Vercel.
- **Storage**: private R2 bucket; presigned URLs for uploads/downloads (no
  public anonymous access); keys namespaced per domain and path-traversal
  rejected; content-type and size limits enforced server-side.
- **Secrets**: everything lives in environment variables; `.env*` is
  gitignored; `AUTH_*` secrets are validated (≥ 32 chars) and never
  committed.
- **Threat model**: family scale — assume casual access by invited guests,
  not nation-states. We still avoid the classic OWASP Top-10 mistakes
  (injection, XSS via React escaping, broken access control, secrets in
  source).

## Reporting a vulnerability

- **Email**: uttampaliwal@outlook.com (or open a private GitHub issue if
  you're a maintainer).
- Include: affected endpoint/URL, step-by-step repro, impact, and your
  suggested fix if you have one.
- We aim to acknowledge within 48 hours and patch quickly for family-scale
  issues. Don't test against the production domain — use a local instance.

## Known trade-offs (accepted deliberately)

- **In-memory rate limits & SSE pub/sub** — reset per serverless instance;
  fine for a family site, revisit if the family grows or the site is public.
- **No email-based 2FA** — approval flow + invite-by-name keeps the circle
  closed; 2FA is a candidate milestone.

## Rotating secrets

If a secret is ever exposed (e.g. an env var pasted into a chat):

1. Generate new `AUTH_ACCESS_TOKEN_SECRET` and `AUTH_REFRESH_TOKEN_SECRET`
   (`openssl rand -base64 48` each).
2. Update Vercel env vars and deploy (all sessions are invalidated — tell
   the family).
3. Rotate `RESEND_API_KEY` and the R2 token the same way.
4. Update `ADMIN_PASSWORD` and rotate the Atlas DB user password.
5. Never reuse the old values.
