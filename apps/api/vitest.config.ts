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
  },
});