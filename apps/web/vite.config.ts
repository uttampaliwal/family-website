import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Listen on all network interfaces. This may expose multiple network addresses,
    // some of which may not be accessible depending on your network configuration.
    host: '0.0.0.0'
  }
})
