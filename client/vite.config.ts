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
          'react-vendor': ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'utils-vendor': ['axios', 'date-fns', 'framer-motion', 'lucide-react'],
          'pdf-vendor': ['pdfjs-dist', 'react-pdf', 'jspdf', 'jspdf-autotable'],
          'charts-vendor': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    sourcemap: true,
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
})
