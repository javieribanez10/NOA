// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Configuración para la aplicación principal
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',  // Permite conexiones desde cualquier dirección IP
    port: 5173,       // Puerto para el desarrollo
    watch: {
      usePolling: true,  // Fundamental en entornos Docker
    },
    hmr: {
      clientPort: 5173,  // Asegura que HMR use el puerto correcto
    },
    proxy: {
      '/api': {
        target: 'http://backend:8000', // Nombre del servicio en Docker Compose
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      // Solo se configura la entrada principal para la app
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        entryFileNames: '[name].js'
      }
    }
  }
})
