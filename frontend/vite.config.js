import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Mirror the production rewrite (frontend/vercel.json) locally: the app always
  // calls a same-origin `/v1`, and the dev server forwards it to the backend on
  // port 4000. Dev and prod then exercise the identical first-party cookie path.
  server: {
    proxy: {
      '/v1': {
        target: 'http://localhost:4000',
        changeOrigin: false,
      },
    },
  },
  build: {
    sourcemap: false,
    // Split heavy vendors into their own chunks so the main bundle stays small
    // and these cache independently across deploys.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
})
