import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// Upstream number-search service. It returns no CORS headers, so the browser
// must call a same-origin path and let a proxy forward the request.
const API_TARGET = process.env.API_PROXY_TARGET || 'https://iransiim.ir';

// Product thumbnails referenced by the API. The host refuses browser image
// requests, so they are proxied through this origin as well.
const IMAGE_TARGET = process.env.IMAGE_PROXY_TARGET || 'https://shop.irancell.ir';

// Local payment API (Express). It answers under /fapi rather than /api so it
// never collides with the store backend, which owns /api on the real domain.
const PAYMENT_TARGET = process.env.PAYMENT_PROXY_TARGET || 'http://127.0.0.1:8787';

const proxy = {
  '/fapi': {
    target: PAYMENT_TARGET,
    changeOrigin: false,
  },
  '/api': {
    target: API_TARGET,
    changeOrigin: true,
    secure: true,
  },
  '/product-image': {
    target: IMAGE_TARGET,
    changeOrigin: true,
    secure: true,
    rewrite: (p: string) => p.replace(/^\/product-image/, ''),
  },
};

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy,
    },
    // `vite preview` serves the production build locally and needs the same proxy.
    preview: {
      proxy,
    },
  };
});
