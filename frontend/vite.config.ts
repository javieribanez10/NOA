import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',  // Permite conexiones desde cualquier dirección IP
    port: 5173,       // Especifica el puerto para el servidor de desarrollo
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
  preview: {
    port: 5173, // Configura la preview para usar el puerto 5173
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        widget: resolve(__dirname, 'src/widget.tsx')
      },
      output: {
        entryFileNames: '[name].js',
      }
    }
  }
});
