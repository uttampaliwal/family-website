import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Configuration constants for better maintainability
const SERVER_CONFIG = {
  HOST: "0.0.0.0", // Listen on all network interfaces
  PORT: 5175, // Default Vite port
} as const;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
