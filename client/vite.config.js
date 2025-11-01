import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    open: process.env.NODE_ENV !== 'production', // Only open in development
    cors: true,
    // Proxy API requests in development
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:7000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // Build configuration for production
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production', // No sourcemaps in production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production', // Remove console.log in production
      }
    },
    // Chunk optimization
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['react-bootstrap', 'bootstrap'],
          router: ['react-router-dom'],
        }
      }
    }
  },
  // Environment variables
  define: {
    'process.env': process.env,
  },
  // Base path for deployment
  base: process.env.NODE_ENV === 'production' ? '/' : '/',
  // Preview configuration (for `vite preview`)
  preview: {
    port: 4173,
    host: true,
    cors: true
  }
})
