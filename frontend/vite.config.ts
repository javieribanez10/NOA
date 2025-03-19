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
    port: 5173,       // Especifica el puerto (predeterminado)
    watch: {
      usePolling: true,  // Importante para detectar cambios en Docker
    },
    hmr: {
      clientPort: 5173,  // Asegura que el cliente HMR use el puerto correcto
    }
  },
});