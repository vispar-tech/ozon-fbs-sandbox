import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// the host runs the backend, the dev stack reaches it by compose service name
const proxyTarget = process.env.VITE_PROXY_TARGET ?? 'http://localhost:3000'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
  server: {
    proxy: {
      '/api': proxyTarget,
      '/static': proxyTarget,
      // a leading ^ makes the key a RegExp; keep it in sync with the nginx rule
      '^/v[0-9]+/': proxyTarget,
    },
  },
})
