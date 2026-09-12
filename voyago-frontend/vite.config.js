import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'beautiful-perfection-production-09e2.up.railway.app',
      'localhost',
    ],
  },
  preview: {
    allowedHosts: [
      'beautiful-perfection-production-09e2.up.railway.app',
      'localhost',
    ],
  },
})

