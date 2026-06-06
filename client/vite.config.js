import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development the React dev server runs on port 5173 and proxies any
// request starting with /api to the Express backend on port 4000.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
