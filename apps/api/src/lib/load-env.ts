import { config } from "dotenv";

// Loads local overrides for development. In production the platform
// injects real variables into process.env and this is a no-op.
config({ path: ".env.local", quiet: true });
