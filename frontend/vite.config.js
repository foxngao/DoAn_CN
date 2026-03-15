// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolveDevProxyTarget } from './src/config/devProxyTarget';

const devProxyTarget = resolveDevProxyTarget();

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // hoặc 4000 nếu bạn muốn đổi
    proxy: {
      '/api': {
        target: devProxyTarget, // URL backend
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      '/socket.io': {
        target: devProxyTarget,
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
