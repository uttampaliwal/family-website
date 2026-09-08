# Deploying Kulaya on the free tier

One Vercel project serves both the web app and the API (the API runs as a
serverless function under `/api`), which keeps everything **same-origin**:
no CORS surface beyond our own origins, and the `SameSite=Lax` session
cookies work without extra setup.

Everything below costs $0/month:

| Service       | Role                       | Free tier                     |
| ------------- | -------------------------- | ----------------------------- |
| Vercel        | Web app + API (serverless) | 100 GB bandwidth/mo           |
| MongoDB Atlas | Database (M0)              | 512 MB storage                |
| Cloudflare R2 | Photo & document storage   | 10 GB / 1M reads / 10M writes |
| Resend        | Transactional email        | 3,000 emails/mo               |

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

## 2. Cloudflare R2 — photo & document storage

Photos and documents are **private family content**, so the bucket is
**private** and the API issues short-lived **presigned URLs** — the API
never proxies file bytes, and the browser talks to R2 directly. Both are
namespaced (`photos/`, `documents/`) inside the same bucket.

1. Create an account at <https://dash.cloudflare.com> (free).
2. **R2 → Create bucket** → name it `kulaya-photos`, keep it **private**.
3. **R2 → Manage R2 API Tokens → Create API token** with **Object Read &
   Write** on that bucket.
   - Copy the **Access Key ID** and **Secret Access Key**.
4. From your **account home**, copy the **Account ID**.
5. Set the R2 environment variables in Vercel (`R2_ACCOUNT_ID`,
   `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`). When they are
   absent the API falls back to local disk (`apps/api/uploads/`) for
   development — production needs R2.

Limits enforced by the API: photos ≤ 20 MB (jpeg/png/webp/gif/avif/heic),
documents ≤ 25 MB (could vary by type — see `@family/core` schemas).

6. **Bucket CORS (required):** the browser PUTs bytes directly to presigned
   R2 URLs, which is cross-origin traffic. Without a CORS policy uploads
   fail despite correct application code. In **R2 → your bucket → Settings →
   CORS policy**, attach a policy scoped to the family domain only:

   ```json
   [
     {
       "AllowedOrigins": ["https://your-family-domain.example"],
       "AllowedMethods": ["PUT", "GET", "HEAD"],
       "AllowedHeaders": ["Content-Type"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   > CORS is **not** authentication here — it only controls which browser
   > origins may make the cross-origin request. Authorization is the
   > short-lived presigned URL itself (10-minute downloads, 15-minute
   > uploads), issued only to signed-in, approved members.

> Optional upgrade: connect a custom domain to the bucket to cache reads at
> the edge. Not required on the free tier.

## 3. Vercel — web + API

1. Import the repo at <https://vercel.com/new>. Set:
   - **Root directory:** `apps/web` (auto-detected from `vercel.json`).
   - **Framework:** Vite.
2. Add **Environment Variables** (Settings → Environment Variables):

   | Name                        | Example                                                               |
   | --------------------------- | --------------------------------------------------------------------- |
   | `DATABASE_URL`              | `mongodb+srv://kulaya:...@cluster0.xxxxx.mongodb.net/kulaya`          |
   | `WEB_ORIGIN`                | `https://your-project.vercel.app` (comma-separated if custom domains) |
   | `AUTH_ACCESS_TOKEN_SECRET`  | `openssl rand -base64 48` output                                      |
   | `AUTH_REFRESH_TOKEN_SECRET` | `openssl rand -base64 48` output                                      |
   | `AUTH_ACCESS_TOKEN_TTL`     | `15m`                                                                 |
   | `AUTH_REFRESH_TOKEN_TTL`    | `30d`                                                                 |
   | `AUTH_MAX_ACTIVE_SESSIONS`  | `5`                                                                   |
   | `RESEND_API_KEY`            | from Resend (section 4)                                               |
   | `EMAIL_FROM`                | `Kulaya <noreply@your-domain.com>`                                    |
   | `ADMIN_EMAIL`               | the first admin's email                                               |
   | `ADMIN_PASSWORD`            | the first admin's password (only used by `seed-admin`)                |
   | `R2_ACCOUNT_ID`             | Cloudflare account ID (section 2)                                     |
   | `R2_ACCESS_KEY_ID`          | R2 API token access key                                               |
   | `R2_SECRET_ACCESS_KEY`      | R2 API token secret                                                   |
   | `R2_BUCKET`                 | `kulaya-photos`                                                       |

   Notes:
   - The API is a Node serverless function (`apps/web/api/index.ts`); in-memory
     rate limits reset per function instance — fine for a family site.
   - `AUTH_*` secrets must be 32+ characters; generate each with
     `openssl rand -base64 48`.

3. Deploy — `dist` serves the web app, `/api/*` is handled by the function,
   mirroring the local dev proxy.

### Server-Sent Events on serverless (read carefully)

Chat and notifications stream via **SSE**. Vercel's Hobby plan caps function
execution at **10 s** (default) unless you opt into streaming:

```json
// apps/web/vercel.json
{
  "functions": {
    "api/index.ts": { "maxDuration": 300 }
  }
}
```

Even with streaming enabled, long-lived connections are at the mercy of
serverless warm/cold cycles. For an always-open family chat the robust
long-term options are:

1. Run the API on a persistent host (a KVM/Render/Northflank/Serv00 instance)
   and point the web app at it, or
2. Accept stream interruptions: the client reconnects automatically and
   treats history as the source of truth, so chat + notifications stay
   correct even with intermittent drops (badge refreshes on reconnect).

## 4. Email — Resend

1. Create an account at <https://resend.com> (3,000 emails/month free).
2. **Domains** → add your domain and verify the DNS records (keeps email
   deliverable and hard to spoof). Update `EMAIL_FROM` to match.
3. Copy the **API key** into Vercel `RESEND_API_KEY`.
4. In development the API logs emails instead of sending them.

## 5. After first deploy

Health check:

```bash
curl -s ${WEB_ORIGIN}/api/health-check
# expect { status: "ok", db: { connected: true, ping: true }, ... } (see /health page)
```

1. Sign up as a regular user, verify email, then approve that user in
   `/admin/approvals` as the seeded admin.
2. Upload a photo in `/photos` and confirm the object appears in the R2 bucket.
3. Post an announcement and confirm email + the in-app bell.
4. Done — the family portal is live.

## 6. Operating runbook

### Backups (do this early)

Neither the free Atlas tier nor R2 backs itself up automatically. The full
retention, deletion, export and recovery policy lives in
[docs/data-lifecycle.md](data-lifecycle.md) — here's the short version:

- **MongoDB**: run `mongodump` on a schedule (hourly/weekly):
  ```bash
  mongodump --uri "$DATABASE_URL" --archive="kulaya-$(date +%F).gz" --gzip
  ```
  (Atlas free clusters offer no point-in-time restore — keep off-site copies.)
- **R2**: budget `rclone` copies to a second location (e.g. another bucket or
  a local disk) for the `photos/` and `documents/` prefixes.

### Monitoring

- Mount `GET /api/health-check` in a free uptime checker (UptimeRobot etc.)
  that alerts when it goes non-`OK`.
- Watch Atlas M0 cluster alerts (connects, ops/s) in the Atlas console.

### Hardening checklist

- Force **HTTPS** and enable **HSTS** in Vercel settings.
- Keep `WEB_ORIGIN` **exactly** the production origin(s) — the API only
  accepts credentials/CORS from this list.
- Rotate `AUTH_ACCESS_TOKEN_SECRET` / `AUTH_REFRESH_TOKEN_SECRET` if ever
  leaked; secret rotation signs everyone out — acceptable for a family site.
- Don't reuse the `ADMIN_PASSWORD` for anything else; the `seed-admin` script
  runs once.
- Consider a custom domain so `WEB_ORIGIN` and `EMAIL_FROM` share one origin
  and Inbox filters can whitelist it.

### Upgrade / rollback

- Every milestone is tagged (`v0.3.x`) on `main` — Vercel redeploys on merge,
  driven by each tag = a known-good deploy.
- To roll back, Vercel supports redeploying a previous production deployment
  from the Deployments tab (no git gymnastics).

## Local development

```bash
cp apps/api/.env.example apps/api/.env.local   # fill in secrets (R2 optional)
docker compose up -d                            # MongoDB 7 (or point DATABASE_URL at Atlas)
pnpm dev                                       # API :3000, web :5173 (proxied)
```

No R2 credentials → photos/documents are stored in `apps/api/uploads/`
(gitignored).

## Troubleshooting

- **Health check shows db disconnected** → `DATABASE_URL` wrong, or Atlas
  network access doesn't include `0.0.0.0/0`.
- **Login fails after deploy** → `AUTH_ACCESS_TOKEN_SECRET`/`AUTH_REFRESH_TOKEN_SECRET`
  missing or changed; clear cookies and sign in again.
- **Uploads 403 from R2** → R2 token lacks Object Read & Write on the bucket,
  or the account/bucket env vars are mismatched.
- **Files are stored locally instead of R2** → R2 env vars (all four) are
  absent in that environment.
- **Emails not arriving** → check Resend domain verification; in dev they're
  logged, not sent.
- **Real-time stops (chat/notifications)** → confirmed cold-cycle; the health
  check endpoint, test `/api/notifications/stream` with `curl -N` locally.
- **CI failing on a PR** → run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
  locally to reproduce.
