// frontend/vite.widget.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  // Reemplazamos process.env para evitar referencias no definidas en el navegador
  define: {
    'process.env': {}
  },
  build: {
    // Configuramos el build en modo librería (library mode)
    lib: {
      entry: resolve(__dirname, 'src/widget.tsx'),
      name: 'MyWidget',         // Nombre global (si es necesario)
      formats: ['iife'],        // IIFE: se ejecuta directamente en el navegador
      fileName: () => 'widget.js'
    },
    rollupOptions: {
      // Aquí no es necesario incluir la entrada "main"
      output: {
        // Mantenemos la nomenclatura para el nombre del archivo final
        entryFileNames: '[name].js'
      }
    }
  }
})
