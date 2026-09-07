import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      AUTH_ACCESS_TOKEN_SECRET: "test-access-secret-0123456789abcdef-012345",
      AUTH_REFRESH_TOKEN_SECRET: "test-refresh-secret-0123456789abcdef-01234",
      WEB_ORIGIN: "http://localhost:5173",
    },
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Pre-warms the mongod binary once in the main process (see
    // src/tests/global-setup.ts) so parallel test-file workers don't race
    // on the mongodb-memory-server download lockfile.
    globalSetup: ["src/tests/global-setup.ts"],
  },
});
