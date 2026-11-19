import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  // A GitHub Pages project site lives under /<repository>/. Local development
  // and regular builds stay at the domain root.
  base: mode === 'pages' ? '/mannerbund/' : '/',
  plugins: [react()],
  server: { port: 5187, strictPort: true },
  build: { chunkSizeWarningLimit: 1100 },
}));
