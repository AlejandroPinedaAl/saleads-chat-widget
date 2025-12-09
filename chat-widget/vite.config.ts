import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Definir process como objeto vacío para evitar errores en el navegador
    'process.env': '{}',
    'process': '{}',
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.tsx'),
      name: 'SaleAdsWidget',
      formats: ['iife'],
      fileName: () => 'widget.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'widget.css';
          }
          return assetInfo.name || 'asset';
        },
        // Inlinear React y otras dependencias para un bundle único
        inlineDynamicImports: true,
      },
    },
    // Minificar para producción
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Mantener console.logs para debugging
        drop_debugger: true,
      },
    },
    // Target browsers modernos
    target: 'es2015',
    // Generar sourcemaps para debugging
    sourcemap: false,
  },
  // Optimizaciones
  optimizeDeps: {
    include: ['react', 'react-dom', 'socket.io-client', 'zustand'],
  },
});

