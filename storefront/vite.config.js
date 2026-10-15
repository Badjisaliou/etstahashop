import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { seoAssets } from './seo-build.js'

export default defineConfig(({ mode }) => ({
  plugins: [react(), seoAssets(loadEnv(mode, process.cwd(), 'VITE_'))],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
}))
