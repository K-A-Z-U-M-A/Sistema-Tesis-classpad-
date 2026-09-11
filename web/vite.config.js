import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Certificados generados con mkcert (HTTPS confiable en red local)
// Para generarlos: mkcert -key-file localhost-key.pem -cert-file localhost-cert.pem "césar.local" "192.168.0.113" localhost 127.0.0.1
const certPath = path.resolve(__dirname, 'localhost-cert.pem')
const keyPath  = path.resolve(__dirname, 'localhost-key.pem')
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ── Pre-bundling en dev: resuelve el FCP lento en el dev server ────────────
  // Vite pre-procesa estos módulos una sola vez en lugar de hacerlo on-demand
  // NOTA: @mui/icons-material NO está aquí intencionalmente —
  //       incluirlo pre-bundlea el paquete completo (6.4MB). Con imports
  //       específicos (@mui/icons-material/MenuIcon) el tree-shaking funciona solo.
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      '@mui/material',
      '@mui/material/styles',
      '@emotion/react',
      '@emotion/styled',
      'recharts',
      'framer-motion',
      'react-hot-toast',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
    ],
  },

  server: {
    host: true,
    allowedHosts: true,
    port: 5173,
    strictPort: true,
    https: hasCerts ? { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) } : false,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: true,
    https: hasCerts ? { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) } : false,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    // Advertir solo cuando un chunk supera 1MB (post-splitting los chunks serán mucho menores)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // ── React core ─────────────────────────────────────────────────────
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }

          // ── MUI íconos (6.4 MB → chunk propio, carga sólo cuando se necesita) ──
          if (id.includes('@mui/icons-material')) {
            return 'vendor-mui-icons';
          }

          // ── MUI core + emotion ─────────────────────────────────────────────
          if (id.includes('@mui/material') ||
              id.includes('@mui/system') ||
              id.includes('@mui/base') ||
              id.includes('@emotion/')) {
            return 'vendor-mui';
          }

          // ── Recharts (gráficas) ────────────────────────────────────────────
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-')) {
            return 'vendor-charts';
          }

          // ── Framer Motion (animaciones) ────────────────────────────────────
          if (id.includes('framer-motion')) {
            return 'vendor-motion';
          }

          // ── Firebase ──────────────────────────────────────────────────────
          if (id.includes('firebase/') || id.includes('@firebase/')) {
            return 'vendor-firebase';
          }

          // ── Formularios ───────────────────────────────────────────────────
          if (id.includes('react-hook-form') || id.includes('yup') || id.includes('@hookform')) {
            return 'vendor-forms';
          }

          // ── Lucide icons ──────────────────────────────────────────────────
          if (id.includes('lucide-react')) {
            return 'vendor-lucide';
          }

          // ── Resto de node_modules → chunk vendor-misc ─────────────────────
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        },
      },
    },
  },
})
