import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";

// Configuration constants for better maintainability
const SERVER_CONFIG = {
  HOST: "0.0.0.0", // Listen on all network interfaces
  PORT: 5175, // Default Vite port
} as const;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", {}]],
      },
    }),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "Yuva Kulya - Family Portal",
        short_name: "Yuva Kulya",
        description: "Your secure family hub for generations to come",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
    process.env.ANALYZE === "true" &&
      visualizer({
        open: true,
        gzipSize: true,
        filename: "dist/stats.html",
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      // Force single React instance to prevent "Cannot read properties of null" errors
      react: path.resolve(__dirname, "../../node_modules/react"),
      "react-dom": path.resolve(__dirname, "../../node_modules/react-dom"),
    },
  },
  server: {
    host: SERVER_CONFIG.HOST,
    port: SERVER_CONFIG.PORT,
    strictPort: false, // Allow auto-increment if port in use
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // Optimize bundle splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and related libraries
          vendor: ["react", "react-dom", "react-router-dom"],
          // UI components chunk
          ui: ["@tanstack/react-query"],
          // Utilities chunk
          utils: ["axios", "date-fns"],
        },
      },
    },
    // Enable source maps for better debugging in production
    sourcemap: true,
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Minify options
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "axios",
      "date-fns",
      "framer-motion",
      "chart.js",
    ],
    exclude: ["@heroicons/react"], // Large icon library - load on demand
  },
  // Enhanced build performance
  esbuild: {
    target: "es2020",
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
  // Enable CSS preprocessing optimizations
  css: {
    devSourcemap: true,
  },
});
