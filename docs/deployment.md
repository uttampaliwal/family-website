# Deploying Kulaya on the free tier

One Vercel project serves both the web app and the API (the API runs as a
serverless function under `/api`), which keeps everything **same-origin**:
no CORS surface beyond our own origins, and the `SameSite=Lax` session
cookies work without extra setup.

Everything below costs $0/month:

| Service | Role | Free tier |
| --- | --- | --- |
| Vercel | Web app + API (serverless) | 100 GB bandwidth/mo |
| MongoDB Atlas | Database (M0) | 512 MB storage |
| Cloudflare R2 | Photo storage | 10 GB / 1M reads / 10M writes |
| Resend | Transactional email | 3,000 emails/mo |

---

## 1. MongoDB — Atlas M0

1. Create an account at <https://www.mongodb.com/atlas> and build a **M0 (free)**
   cluster (pick a region close to your Vercel deployment).
2. **Database Access** → add a user (e.g. `kulaya`) with read/write rights and
   a strong password.
3. **Network Access** → allow `0.0.0.0/0` (Vercel functions have dynamic IPs).
4. **Database → Connect → Drivers** → copy the connection string and replace
   `<password>`.
5. Create the first admin (from `apps/api`, with the same secrets as Vercel):

   ```bash
   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=<strong password> \
     pnpm --filter @family/api seed-admin
   ```

   (Promotes an existing user, or creates `Administrator`.)

## 2. Cloudflare R2 — photo storage

Photos are **private family photos**, so the bucket is **private** and the API
issues short-lived **presigned URLs** — the API never proxies file bytes, and
the browser talks to R2 directly.

1. Create an account at <https://dash.cloudflare.com> (free).
2. **R2 → Create bucket** → name it `kulaya-photos` (region: same as your
   Vercel/Atlas region), keep it **private**.
3. **R2 → Manage R2 API Tokens → Create API token** with permission:
   - **Object Read & Write** on `kulaya-photos` (leave "Apply to" = the bucket).
   - Copy the **Access Key ID** and **Secret Access Key**.
4. From your **account home**, copy the **Account ID** (top right → Account ID).
5. Set the R2 environment variables in Vercel (table below). When R2 variables
   are absent the API falls back to local disk (`apps/api/uploads/`) for
   development — production needs R2.

Limits enforced by the API: photos ≤ 20 MB, types `jpeg/png/webp/gif/avif/heic`.

> Optional upgrade: connect a custom domain to the bucket to cache image
> reads at the edge. Not required on the free tier.

## 3. Vercel — web + API

1. Import the repo at <https://vercel.com/new>. Set:
   - **Root directory:** `apps/web` (auto-detected from `vercel.json`).
   - **Framework:** Vite.
2. Add **Environment Variables** (Settings → Environment Variables):

   | Name | Example |
   | --- | --- |
   | `DATABASE_URL` | `mongodb+srv://kulaya:...@cluster0.xxxxx.mongodb.net/kulaya` |
   | `WEB_ORIGIN` | `https://your-project.vercel.app` (comma-separated if custom domains) |
   | `AUTH_ACCESS_TOKEN_SECRET` | `openssl rand -base64 48` output |
   | `AUTH_REFRESH_TOKEN_SECRET` | `openssl rand -base64 48` output |
   | `AUTH_ACCESS_TOKEN_TTL` | `15m` |
   | `AUTH_REFRESH_TOKEN_TTL` | `30d` |
   | `AUTH_MAX_ACTIVE_SESSIONS` | `5` |
   | `RESEND_API_KEY` | from Resend (section 4) |
   | `EMAIL_FROM` | `Kulaya <noreply@your-domain.com>` |
   | `ADMIN_EMAIL` | the first admin's email |
   | `ADMIN_PASSWORD` | the first admin's password (used only by `seed-admin`) |
   | `R2_ACCOUNT_ID` | Cloudflare account ID (section 2) |
   | `R2_ACCESS_KEY_ID` | R2 API token access key |
   | `R2_SECRET_ACCESS_KEY` | R2 API token secret |
   | `R2_BUCKET` | `kulaya-photos` |

   Notes:
   - The API is a Node serverless function (`apps/web/api/index.ts`); in-memory
     rate limits reset per function instance — fine for a family site.
   - `AUTH_*` secrets must be 32+ characters; generate each with
     `openssl rand -base64 48`.
3. Deploy — `dist` serves the web app, `/api/*` is handled by the function,
   mirroring the local dev proxy.
4. **Continuous deployment:** the `CI` workflow (lint → typecheck → test →
   build) runs on every push/PR to `main`; Vercel previews come up per PR
   automatically.

## 4. Email — Resend

1. Create an account at <https://resend.com> (3,000 emails/month free).
2. **Domains** → add your domain and verify the DNS records (so emails aren't
   spoofed). Update `EMAIL_FROM` to use it.
3. Copy the **API key** into Vercel `RESEND_API_KEY`.
4. In development the API logs emails instead of sending them.

## 5. After first deploy

1. Visit `/health` (or `GET /api/health-check`) — expect `db.connected: true`.
2. Sign up as a regular user, verify email, then approve that user in
   `/admin/approvals` as the seeded admin.
3. Upload a photo in `/photos` and confirm the object appears in the R2 bucket.
4. Done — the family portal is live.

## Local development

```bash
cp apps/api/.env.example apps/api/.env.local   # fill in secrets (R2 optional)
mongod --dbpath ~/data/mongodb                 # or point DATABASE_URL at Atlas
pnpm dev                                       # API :3000, web :5173 (proxied)
```

No R2 credentials → photos are stored in `apps/api/uploads/` (gitignored).

## Troubleshooting

- **Health check shows db disconnected** → `DATABASE_URL` wrong, or Atlas
  network access doesn't include `0.0.0.0/0`.
- **Login fails after deploy** → `AUTH_ACCESS_TOKEN_SECRET`/`AUTH_REFRESH_TOKEN_SECRET`
  missing or changed; clear cookies and sign in again.
- **Uploads 403 from R2** → R2 token lacks Object Read & Write on the bucket,
  or the account/bucket env vars are mismatched.
- **Emails not arriving** → check Resend domain verification; in dev they're
  logged, not sent.
- **CI failing on a PR** → run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
  locally to reproduce.
