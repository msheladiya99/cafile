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
        manualChunks: {
          'vendor-mui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'vendor-utils': ['react-router-dom', 'framer-motion', 'react-helmet-async'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
})
