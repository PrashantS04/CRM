import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vite does not put .env values into process.env for this file, so read them here (a real environment
  // variable still wins). The shared CRM backend (LMS_CRM_BACKEND) runs on 8081 with context path /api.
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.CRM_API_URL || 'http://localhost:8081'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    optimizeDeps: {
      // Lazy routes import libraries the first page never touches. Scanning every source
      // file up front pre-bundles them in one pass, so the dev server never re-optimizes
      // mid-load (which serves mismatched React copies and breaks hooks).
      entries: ['index.html', 'src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/test/**'],
    },
    server: {
      proxy: { '/api': apiTarget },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  }
})
