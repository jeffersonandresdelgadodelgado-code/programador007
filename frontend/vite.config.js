import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// ============================================================
//  Configuracion de Vite + PWA
//  - Proxy /api -> backend (puerto 4000) en desarrollo
//  - VitePWA genera el service worker y el manifest para
//    poder instalar la app en el telefono.
// ============================================================
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png'],
      manifest: {
        name: 'Box Motivacion CrossFit',
        short_name: 'Box Motivacion',
        description: 'Gestion del gimnasio Box Motivacion CrossFit',
        theme_color: '#1CA3DE',
        background_color: '#0b1120',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Permite navegar offline a las rutas de la SPA
        navigateFallback: '/index.html',
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
    },
  },
});
