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
        // Letting Vite handle chunks automatically is often best for tree-shaking
      },
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
})
