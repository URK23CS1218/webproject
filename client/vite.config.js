import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Vite's default port that usually works
    host: true,
    open: true // automatically open browser
  }
})