import { handle } from "hono/vercel";
import { createApp } from "../../api/src/app.js";
import { connectDb } from "../../api/src/lib/db.js";

// Vercel serverless entry — the whole API serves same-origin under /api,
// matching the Vite dev proxy (Lax cookies, no CORS needed).
const app = createApp();

// Mongoose keeps a cached connection; connect lazily on cold start and
// fail fast (production) if the database is unreachable.
void connectDb();

export default handle(app);
