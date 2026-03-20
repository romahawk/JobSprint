import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/scheduler')
          ) {
            return 'react-core';
          }
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }
          if (
            id.includes('node_modules/react-dnd') ||
            id.includes('node_modules/react-dnd-html5-backend')
          ) {
            return 'dnd';
          }
          if (
            id.includes('node_modules/react-hook-form') ||
            id.includes('node_modules/react-day-picker') ||
            id.includes('node_modules/input-otp')
          ) {
            return 'forms';
          }
          if (
            id.includes('node_modules/@popperjs/core') ||
            id.includes('node_modules/react-popper') ||
            id.includes('node_modules/cmdk') ||
            id.includes('node_modules/embla-carousel-react') ||
            id.includes('node_modules/react-resizable-panels') ||
            id.includes('node_modules/vaul')
          ) {
            return 'ui-extras';
          }
          if (id.includes('node_modules/pdfjs-dist')) {
            return 'pdfjs';
          }
          if (id.includes('node_modules/mammoth')) {
            return 'mammoth';
          }
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix';
          }
          if (id.includes('node_modules/motion')) {
            return 'motion';
          }
          if (id.includes('node_modules/firebase')) {
            return 'firebase';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }
          if (
            id.includes('node_modules/sonner') ||
            id.includes('node_modules/next-themes') ||
            id.includes('node_modules/date-fns')
          ) {
            return 'ui-support';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },
})
