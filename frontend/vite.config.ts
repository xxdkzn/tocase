import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // React core + dependencies that use React
            if (id.includes('react') || id.includes('react-dom') || id.includes('zustand') || id.includes('use-sync-external-store')) {
              return 'react-vendor';
            }
            // React Router
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            // Framer Motion
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            // Axios
            if (id.includes('axios')) {
              return 'http-vendor';
            }
            // Other node_modules
            return 'vendor';
          }

          // Admin chunk
          if (id.includes('/pages/admin/') || id.includes('/components/admin/')) {
            return 'admin';
          }
        },
      },
    },
  },
});