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
          // Split MUI core and icons separately — icons alone are ~2MB
          'vendor-mui-core': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'vendor-mui-icons': ['@mui/icons-material'],
          // Router and helmet are needed on first paint
          'vendor-router': ['react-router-dom', 'react-helmet-async'],
          // Data fetching libraries
          'vendor-query': ['@tanstack/react-query', 'axios'],
          // Animation library (not needed on login)
          'vendor-motion': ['framer-motion'],
          // PDF viewer loaded only on file pages
          'vendor-pdf': ['pdfjs-dist'],
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

