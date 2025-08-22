import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Configuration constants for better maintainability
const SERVER_CONFIG = {
  HOST: '0.0.0.0', // Listen on all network interfaces
  PORT: 5173 // Default Vite port
} as const;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: SERVER_CONFIG.HOST,
    port: SERVER_CONFIG.PORT,
    strictPort: true, // Force use of specified port, don't auto-increment
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  }
})