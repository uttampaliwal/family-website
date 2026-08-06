# Deploying Kulaya on the free tier

One Vercel project serves both the web app and the API (the API runs as
serverless functions under `/api`), which keeps everything same-origin:
no CORS, and the `SameSite=Lax` session cookies work without extra setup.

## 1. MongoDB — Atlas M0 (free)

1. Create an account at <https://www.mongodb.com/atlas> and build a **M0 (free)**
   cluster (pick a region close to your Vercel deployment).
2. In **Database Access** create a database user (e.g. `kulaya`) with
   read/write rights and a strong password.
3. In **Network Access** allow `0.0.0.0/0` (Vercel functions have dynamic IPs).
4. In **Database → Connect → Drivers**, copy the connection string and replace
   `<password>` with your user's password.
5. Run `pnpm --filter @family/api exec tsx src/scripts/seed-admin.ts -- admin@example.com <password>`
   locally (or via a one-off Vercel build log) to create the first admin.

## 2. Vercel — web + API (free)

1. Import the repo at <https://vercel.com/new>. When prompted, set:
   - **Root directory:** `apps/web` (Vercel auto-detects `vercel.json`).
   - **Framework:** Vite.
2. Add these **Environment Variables** (Settings → Environment Variables):

   | Name | Example |
   | --- | --- |
   | `DATABASE_URL` | `mongodb+srv://kulaya:...@cluster0.xxxxx.mongodb.net/kulaya` |
   | `WEB_ORIGIN` | `https://your-project.vercel.app` (comma-separated for custom domains) |
   | `AUTH_ACCESS_TOKEN_SECRET` | `openssl rand -base64 48` output |
   | `AUTH_REFRESH_TOKEN_SECRET` | `openssl rand -base64 48` output |
   | `AUTH_ACCESS_TOKEN_TTL` | `15m` |
   | `AUTH_REFRESH_TOKEN_TTL` | `30d` |
   | `AUTH_MAX_ACTIVE_SESSIONS` | `5` |
   | `RESEND_API_KEY` | from Resend (below) |
   | `EMAIL_FROM` | `Kulaya <noreply@your-domain.com>` |
   | `ADMIN_EMAIL` | the first admin's email |

   The API runs as a Node serverless function (`apps/web/api/index.ts`),
   bundled automatically by Vercel. In-memory rate limits reset per function
   instance — fine for a family site; upgrade to Upstash if it ever matters.
3. Deploy. The web app is served from `dist`, and `/api/*` is handled by the
   function — exactly like the local dev proxy.

## 3. Email — Resend (free)

1. Create an account at <https://resend.com> (free tier: 3,000 emails/month).
2. **Domains** → add your domain and verify DNS records (so emails aren't
   spoofed). Update `EMAIL_FROM` to use it.
3. Copy the **API key** into the Vercel `RESEND_API_KEY` variable.
4. In development, the API logs emails instead of sending them.

## 4. Photos later — Cloudflare R2 (free)

Photo uploads (M6) will use an R2 bucket with presigned upload URLs, so the
API never proxies large files. Setup guide will be added with that milestone.

## Local development

```bash
cp apps/api/.env.example apps/api/.env.local   # fill in secrets
mongod --dbpath ~/data/mongodb                 # or run MongoDB Atlas
pnpm dev                                       # API :3000, web :5173 (proxied)
```
