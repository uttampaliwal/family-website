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
        // Online-first (P1): the service worker precaches the app shell so
        // the UI loads offline, but NEVER caches authenticated API
        // responses. Family data is served from the network only; offline
        // the shell renders with an offline notice instead of stale data.
        // (Removed: StaleWhileRevalidate kulaya-data for /members|photos|
        // events|announcements — it served revoked users' cached datasets.)
        runtimeCaching: [],
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
          if (
            id.includes("node_modules/react-router") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react/") ||
            id.includes("node_modules/scheduler")
          )
            return "react";
          if (id.includes("@tanstack/react-query") || id.includes("zustand"))
            return "data";
          if (id.includes("lucide-react")) return "icons";
          // Workspace packages resolve to their real source paths,
          // not to a node_modules/@family/* id, so match both forms.
          if (id.includes("@family/ui") || id.includes("/packages/ui/"))
            return "ui";
          if (
            id.includes("@family/core") ||
            id.includes("/packages/core/") ||
            id.includes("node_modules/zod")
          )
            return "contracts";
        },
      },
    },
    target: "es2022",
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
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
