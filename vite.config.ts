import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const alias = {
  '@': path.resolve(__dirname, './src'),
  '@shared': path.resolve(__dirname, './src/shared'),
  '@features': path.resolve(__dirname, './src/features'),
  '@api': path.resolve(__dirname, './src/api'),
  '@pages': path.resolve(__dirname, './src/pages'),
  '@assets': path.resolve(__dirname, './src/assets'),
}

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    resolve: { alias },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
})
