import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: false, filename: 'dist/stats.html' })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'vendor_firebase';
            }
            if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype') || id.includes('katex') || id.includes('highlight.js')) {
              return 'vendor_markdown';
            }
            // Group the rest of node_modules, including React, into a single vendor chunk.
            return 'vendor';
          }
        },
      },
    },
  },
})