import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // If you need path aliases, define them here
      // '@': '/src',
    },
  },
  // Ensure environment variables are properly loaded
  define: {
    // This provides better compatibility for libraries that expect process.env
    // But you should still use import.meta.env in your own code
    'process.env': process.env,
  },
  server: {
    // Enable CORS if needed
    cors: true,
    // Configure proxy if needed
    // proxy: {
    //   '/api': {
    //     target: 'https://rest-api-generator-serv.vercel.app',
    //     changeOrigin: true,
    //   },
    // },
  },
});