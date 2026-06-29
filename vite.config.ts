import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  esbuild: {
    target: 'safari13'
  },
  build: {
    target: 'safari13'
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'safari13'
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['openstage-icon.svg'],
      manifest: {
        name: 'OpenStage PWA',
        short_name: 'OpenStage',
        description: 'Offline-first songbook and performance chart app for musicians.',
        theme_color: '#0f172a',
        background_color: '#0b1020',
        display: 'fullscreen',
        orientation: 'any',
        start_url: '/',
        icons: [
          {
            src: '/openstage-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}']
      }
    })
  ]
});
