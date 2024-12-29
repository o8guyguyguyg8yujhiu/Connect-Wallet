import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import rollupNodePolyFill from 'rollup-plugin-polyfill-node';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true, // Добавлен полифил для process
        }),
      ],
    },
  },
  build: {
    rollupOptions: {
      plugins: [rollupNodePolyFill()],
    },
    commonjsOptions: {
      transformMixedEsModules: true, // Исправление для поддержки модулей
    },
  },
  resolve: {
    alias: {
      buffer: 'buffer', // Указывает Vite использовать полифил Buffer
      process: 'process/browser', // Добавлен алиас для process
    },
  },
  server: {
    port: 3000, // Задание порта для локального сервера
    open: true, // Автоматически открывает приложение в браузере
  },
});
