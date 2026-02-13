import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 4200,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src-react/test/setup.ts',
    include: ['src-react/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'src/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src-react/**/*.{ts,tsx}'],
      exclude: ['src-react/main.tsx', 'src-react/test/**'],
    },
  },
});
