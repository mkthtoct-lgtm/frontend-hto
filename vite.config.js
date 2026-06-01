import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api/v1": {
        target: "https://api.hto.edu.vn",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'spa-fallback-404',
      closeBundle() {
        // Copy index.html → 404.html so Vercel serves the SPA
        // even when no file matches the requested path (e.g. /reset-password)
        const dist = resolve(import.meta.dirname, 'dist')
        const index = resolve(dist, 'index.html')
        const fallback = resolve(dist, '404.html')
        if (fs.existsSync(index)) {
          fs.copyFileSync(index, fallback)
        }
      },
    },
  ],
})

