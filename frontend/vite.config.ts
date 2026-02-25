import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
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
          // Vendor chunks for major libraries
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // React Router
            if (id.includes('react-router-dom')) {
              return 'router-vendor';
            }
            // Framer Motion (heavy animation library)
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            // Zustand (state management)
            if (id.includes('zustand')) {
              return 'state-vendor';
            }
            // Axios (HTTP client)
            if (id.includes('axios')) {
              return 'http-vendor';
            }
            // Other node_modules
            return 'vendor';
          }
          
          // Admin chunk for all admin-related code
          if (id.includes('/pages/admin/') || id.includes('/components/admin/')) {
            return 'admin';
          }
        },
      },
    },
  },
});
