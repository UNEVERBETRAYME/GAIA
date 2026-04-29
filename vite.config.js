import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    entries: ['index.html'],
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: '@use "@/assets/scss/_variables.scss" as *;',
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3456',
    },
  },
})