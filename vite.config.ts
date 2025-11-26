import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  define: {
    global: 'globalThis',
  },
  css: {
    postcss: './postcss.config.js',
  },
  preview: {
    port: 4173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  // CSP headers for TikTok embeds
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.tiktok.com; frame-src 'self' https://www.tiktok.com https://*.tiktok.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data: https:;",
    },
  },
})