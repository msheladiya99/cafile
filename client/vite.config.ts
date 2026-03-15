import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  build: {
    commonjsOptions: {
      include: [/pdfjs-dist/, /node_modules/],
    },
    rollupOptions: {
      output: {
        // Remove manualChunks to prevent over-eager pre-fetching of lazy modules
      },
    },
    chunkSizeWarningLimit: 600,
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
})
