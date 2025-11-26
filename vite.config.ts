import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    headers: {
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://platform.twitter.com https://www.instagram.com https://cdn.syndication.twimg.com;
        style-src 'self' 'unsafe-inline' https://platform.twitter.com https://ton.twimg.com https://fonts.googleapis.com;
        img-src 'self' data: https: http: blob:;
        font-src 'self' data: https://platform.twitter.com https://ton.twimg.com https://fonts.gstatic.com;
        connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.youtube.com https://publish.twitter.com https://graph.facebook.com https://syndication.twitter.com https://cdn.syndication.twimg.com;
        frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://platform.twitter.com https://www.instagram.com https://youtube.com https://youtu.be;
        media-src 'self' https: data: blob:;
        child-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://platform.twitter.com https://www.instagram.com;
      `.replace(/\s+/g, ' ').trim()
    }
  }
});

