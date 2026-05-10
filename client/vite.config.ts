import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: [
      'pdfjs-dist',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      'lucide-react'
    ],
  },
  build: {
    commonjsOptions: {
      include: [/pdfjs-dist/, /node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@mui/icons-material')) return 'vendor-mui-icons';
            if (id.includes('pdfjs-dist')) return 'vendor-pdf';
            // Let everything else be handled by Vite's automatic chunking 
            // for better tree-shaking efficacy on the initial bundle.
          }
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

