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
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Stable vendor chunks -> long-lived browser cache, no >500 kB blob.
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          data: ["@tanstack/react-query", "zustand"],
          ui: ["@family/ui"],
          icons: ["lucide-react"],
          contracts: ["@family/core"],
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
