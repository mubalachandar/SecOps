import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: { 
      '/api': { 
        target: 'http://backend:5000', 
        changeOrigin: true, 
        secure: false,
        ws: true 
      } 
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts', 'd3-scale'],
          query: ['@tanstack/react-query'],
          maps: ['react-simple-maps'],
          ui: ['lucide-react', 'clsx', 'tailwind-merge']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
