/**
 * Vite + Vitest configuration — SYS® Minimalist Browser
 * ------------------------------------------------------------------
 * - React plugin for fast HMR + automatic JSX transform.
 * - Tailwind v4 via its native Vite plugin (no PostCSS config needed).
 * - server.host 0.0.0.0 → the app is reachable through the Arena live
 *   preview proxy (browser never talks to localhost directly).
 * - Build targets ES2020 and keeps inlined sourcemaps out of prod.
 * - `test` block configures Vitest to render components in jsdom.
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    // Bind to all interfaces so the platform preview proxy can reach it.
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    // The sandboxed live-preview proxy uses a per-session subdomain of
    // *.e2b.app — allow all hosts in dev so the preview always loads.
    allowedHosts: true,
  },

  build: {
    // ES2020 keeps the bundle small while staying compatible with
    // evergreen browsers (Chrome/Edge/Firefox/Safari for ~2 years).
    target: 'es2020',
    // Split CSS into its own file; enables long-term caching.
    cssCodeSplit: true,
    // Friendly chunk names in the network panel.
    chunkSizeWarningLimit: 512,
  },

  test: {
    // DOM environment for the interaction smoke suite (src/App.test.jsx).
    environment: 'jsdom',
    globals: true,
    clearMocks: true,
  },
});
