import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',  // Permite conexiones desde cualquier dirección IP
    port: 5173,       // Especifica el puerto
    watch: {
      usePolling: true,  // Importante para detectar cambios en Docker
    },
    hmr: {
      clientPort: 5173,  // Asegura que el cliente HMR use el puerto correcto
    },
    proxy: {
      '/api': {
        target: 'http://backend:8000', // Se usa el nombre del servicio en Docker Compose
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
