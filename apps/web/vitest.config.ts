import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: [
        "text",
        "text-summary",
        "json-summary",
        [
          "html",
          {
            skipEmpty: true,
            subdir: ".",
          },
        ],
      ],
      exclude: [
        "node_modules/",
        "src/setupTests.ts",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/__tests__/**",
        "dist/**",
        "coverage/**",
      ],
      // Reduce file system noise
      reportOnFailure: true,
      clean: true,
      all: true,
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  },
});
