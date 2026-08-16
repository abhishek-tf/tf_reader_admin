import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The backend runs on 8080. Proxying /api in dev means the browser sees one origin,
// so there is no CORS to configure and no base URL to switch between dev and build.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
