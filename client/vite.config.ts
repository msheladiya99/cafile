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
          // Core React ecosystem — always needed, load first
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'vendor-react';
          }
          // MUI emotion runtime — needed by all MUI components
          if (id.includes('node_modules/@emotion/')) {
            return 'vendor-emotion';
          }
          // MUI icons — very large, only load when needed per-page via lazy
          if (id.includes('node_modules/@mui/icons-material/')) {
            return 'vendor-mui-icons';
          }
          // MUI core components
          if (id.includes('node_modules/@mui/material/') || id.includes('node_modules/@mui/system/') || id.includes('node_modules/@mui/base/') || id.includes('node_modules/@mui/utils/')) {
            return 'vendor-mui';
          }
          // tanstack query
          if (id.includes('node_modules/@tanstack/')) {
            return 'vendor-tanstack';
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
