import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiBase = process.env.CONTENT_API_BASE ?? 'http://127.0.0.1:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Must come before '/api' so auth routes hit port 9000
      '/api/auth': {
        target: apiBase,
        changeOrigin: true,
      },
      '/api': {
        target: apiBase,
        changeOrigin: true,
      },
    },
  },
})
