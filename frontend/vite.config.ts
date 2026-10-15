import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'AdFra Ges',
        short_name: 'AdFra Ges',
        description:
          'Sistema de gestión personal para finanzas, proyectos freelance, wishlist y productividad diaria.',
        start_url: '/?source=pwa',
        display: 'standalone',
        orientation: 'any',
        background_color: '#faf8fc',
        theme_color: '#6d28d9',
        categories: ['finance', 'productivity', 'business'],
        lang: 'es',
        shortcuts: [
          {
            name: 'Registrar Gasto',
            short_name: 'Gasto',
            url: '/transacciones/nuevo?tipo=gasto',
            icons: [{ src: '/icons/shortcut-expense.png', sizes: '96x96', type: 'image/png' }],
          },
          {
            name: 'Registrar Ingreso',
            short_name: 'Ingreso',
            url: '/transacciones/nuevo?tipo=ingreso',
            icons: [{ src: '/icons/shortcut-income.png', sizes: '96x96', type: 'image/png' }],
          },
          {
            name: 'Nota Rápida',
            short_name: 'Nota',
            url: '/bitacora/nuevo',
            icons: [{ src: '/icons/shortcut-note.png', sizes: '96x96', type: 'image/png' }],
          },
        ],
        icons: [
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-data-cache',
              expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        navigateFallback: '/index.html',
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
