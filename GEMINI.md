# Gemini Settings

This file contains recommended settings for the Gemini CLI.

Make Website Responsive, attractive, stylish, Modern, and most importantly fast and robust.

Very all security concerns before building.

Check if all connections, routes for frontend, backend and database are properly integrated and connected. Ensure at every turn to make system run, engage and deliver effectively and efficiently.

## settings.json

```json
{
  "mcp_servers": [
    {
      "name": "local-api",
      "url": "http://localhost:3000"
    }
  ]
}
```

## Gemini Added Memories

- The `.env` file exists at the project root and contains necessary environment variables for Docker Compose and the application.
- **Docker Setup Enhancements:**
  - Added `curl` to `apps/api/Dockerfile` and `apps/web/Dockerfile` for health checks.
  - Corrected `docker-compose.yml` health check URLs and port mappings (`web` service now maps `80:5173`).
  - All Docker containers (`mongo`, `api`, `web`) are now running and reporting as `healthy`.
  - The frontend is accessible at `http://localhost:80/`.
- **API Service Fixes:**
  - **CSRF Middleware:** Rewrote `apps/api/src/middleware/csrfGenerator.ts` for correct Express middleware chaining (`csrfProtection` array) and updated its usage in `apps/api/src/index.ts`, `apps/api/src/routes/auth.ts`, `apps/api/src/routes/documents.ts`, and `apps/api/src/routes/userData.ts`.
  - **ES Module Compatibility:**
    - Added `"type": "module"` to `apps/api/package.json`.
    - Updated `apps/api/tsconfig.json` to compile to `esnext` modules.
    - Refactored `__dirname` usage in `apps/api/src/middleware/fileUpload.ts` and `apps/api/src/routes/documents.ts` to use `import.meta.url` for ES module compatibility.
  - **Mongoose Warnings:** Resolved duplicate index warnings in `apps/api/src/models/User.ts` by removing redundant `UserSchema.index()` calls.
  - **Linting Errors:** Fixed `no-unused-vars` ESLint errors in API route files (`auth.ts`, `documents.ts`, `userData.ts`).
  - **`MODULE_TYPELESS_PACKAGE_JSON` Warning:** Resolved by adding `"type": "module"` to `apps/api/package.json`.
