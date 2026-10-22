// Configuración de Vite y Vitest (design.md §3 y §13).
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const raiz = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Rutas relativas en la versión construida (design.md §13).
  base: './',
  build: {
    rollupOptions: {
      // La página temporal de T-01 (prueba-recursos.html) se retiró en T-17.
      input: { principal: resolve(raiz, 'index.html') }
    }
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js']
  }
});
