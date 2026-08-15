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
})
