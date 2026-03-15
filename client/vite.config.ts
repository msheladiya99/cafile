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
        manualChunks(id) {
          // Core React ecosystem — smaller chunks are better for Lighthouse
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'vendor-core';
          }
          // tanstack query
          if (id.includes('node_modules/@tanstack/')) {
            return 'vendor-tanstack';
          }
          // Large utility libraries
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/pdfjs-dist')) {
            return 'vendor-utils-pdf';
          }
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
})
