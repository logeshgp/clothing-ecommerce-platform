import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const [repositoryOwner, repositoryName] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
const pagesBase = process.env.GITHUB_ACTIONS && repositoryName && repositoryName !== `${repositoryOwner}.github.io`
  ? `/${repositoryName}/`
  : '/';

/**
 * The admin + support console is a separate application served from its own
 * origin (port 5174 in development). Keeping it out of the storefront bundle
 * means no staff-only code or routes ever reach a shopper's browser.
 */
export default defineConfig({
  root: 'console',
  base: `${pagesBase}console/`,
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      // Shared primitives, tokens and helpers live in the storefront tree.
      '@store': path.resolve(import.meta.dirname, 'src'),
      '@shared': path.resolve(import.meta.dirname, 'shared'),
    },
  },

  server: {
    port: 5174,
    host: true,
    allowedHosts: true,
  },

  preview: {
    port: 4174,
    host: true,
    allowedHosts: true,
  },

  build: {
    outDir: '../dist-console',
    emptyOutDir: true,
    sourcemap: false,
  },
});
