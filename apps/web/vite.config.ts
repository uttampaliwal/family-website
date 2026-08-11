import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["family-icon.svg"],
      manifest: {
        name: "Kulaya — The Family Nest",
        short_name: "Kulaya",
        description:
          "The family nest — photos, events, documents, and moments, kept private.",
        theme_color: "#b4532a",
        background_color: "#faf7f2",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "family-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "family-icon-maskable.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\/api\/(members|photos|events|announcements)(\/|\?|$)/,
            handler: "StaleWhileRevalidate",
            method: "GET",
            options: {
              cacheName: "kulaya-data",
              cacheableResponse: { statuses: [0, 200] },
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 24 * 14,
              },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Stable vendor chunks -> long-lived browser cache, no >500 kB blob.
        // Function form so subpath entries (react/jsx-runtime, react-dom/client,
        // scheduler) join their family instead of leaking into the entry chunk.
        manualChunks(id) {
          if (id.includes("node_modules/react-router") ||
              id.includes("node_modules/react-dom") ||
              id.includes("node_modules/react/") ||
              id.includes("node_modules/scheduler")) return "react";
          if (id.includes("@tanstack/react-query") || id.includes("zustand")) return "data";
          if (id.includes("lucide-react")) return "icons";
          // Workspace packages resolve to their real source paths,
          // not to a node_modules/@family/* id, so match both forms.
          if (id.includes("@family/ui") || id.includes("/packages/ui/")) return "ui";
          if (id.includes("@family/core") || id.includes("/packages/core/") || id.includes("node_modules/zod")) return "contracts";
        },
      },
    },
    target: "es2022",
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setup-tests.ts"],
  },
});
