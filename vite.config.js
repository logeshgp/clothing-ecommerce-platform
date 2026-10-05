import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const [repositoryOwner, repositoryName] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
const pagesBase = process.env.GITHUB_ACTIONS && repositoryName && repositoryName !== `${repositoryOwner}.github.io`
  ? `/${repositoryName}/`
  : '/';

export default defineConfig({
  base: pagesBase,
  plugins: [react(), tailwindcss()],

  server: {
    port: 5173,
    // Bind to every interface so phones and laptops on the same network can connect.
    host: true,
    // Required for tunnels (cloudflared / ngrok) — otherwise Vite blocks the forwarded Host header.
    allowedHosts: true,
    hmr: { clientPort: undefined },
  },

  preview: {
    port: 4173,
    host: true,
    allowedHosts: true,
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
