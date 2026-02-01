import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
          socket: ['socket.io-client'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  server: {
    historyApiFallback: true,
  },
})
