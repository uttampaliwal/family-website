# Environment Variables Setup Guide

## Required Environment Variables for Vercel

### Frontend (Web App) Variables

Only **ONE** environment variable is critical for the frontend:

```
VITE_API_BASE_URL=https://your-api-domain.com
```

**Note**: Since you're deploying only the frontend to Vercel, you'll need to:

1. Deploy your API separately (e.g., Railway, Render, or another Vercel project)
2. Update `VITE_API_BASE_URL` to point to your API deployment

### Optional Frontend Variables (with defaults)

These have fallbacks in the code, so they're optional:

```
VITE_ACCESS_TOKEN_KEY=accessToken
VITE_USERNAME_KEY=username
VITE_USER_KEY=user
VITE_LOGIN_PATH=/login
VITE_API_URL=http://localhost:3000
```

### Backend Variables (Not Needed for Frontend Deployment)

These warnings can be ignored for frontend-only deployment:

- MONGO_INITDB_ROOT_USERNAME
- MONGO_INITDB_ROOT_PASSWORD
- MONGO_APP_USERNAME
- MONGO_APP_PASSWORD
- PORT
- MONGO_HOST
- JWT_SECRET
- REFRESH_TOKEN_SECRET
- FRONTEND_URL
- EMAIL_USER
- EMAIL_PASS
- GEMINI_API_KEY
- GROK_API_KEY
- TURBO_TELEMETRY_DISABLED
- DO_NOT_TRACK

## How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project: `family-website`
3. Go to Settings → Environment Variables
4. Add: `VITE_API_BASE_URL` with your API URL
5. Redeploy the project

## Current Status

✅ Frontend deployment is working correctly
⚠️ API calls will fail until backend is deployed and `VITE_API_BASE_URL` is configured
