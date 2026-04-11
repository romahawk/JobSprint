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

  // Bind preview server to IPv4 loopback so Playwright's health-check URL
  // (http://127.0.0.1:4173) resolves correctly on Linux CI runners where
  // 'localhost' resolves to ::1 (IPv6) by default.
  preview: {
    host: '127.0.0.1',
    port: 4173,
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // mammoth (868 KB Word-doc parser) is only ever reached via a
          // dynamic import in cvFileImportService – give it its own lazy
          // chunk so it never lands in the eagerly-preloaded vendor bundle.
          if (id.includes('node_modules/mammoth')) {
            return 'mammoth';
          }
          // cmdk and vaul both depend on @radix-ui internals.  Keeping them
          // in the vendor chunk creates a radix→vendor→radix circular chunk
          // dependency that can cause modules to see partially-initialised
          // exports in headless Chromium (CI), silently breaking React.
          if (
            id.includes('node_modules/@radix-ui') ||
            id.includes('node_modules/cmdk') ||
            id.includes('node_modules/vaul')
          ) {
            return 'radix';
          }
          if (id.includes('node_modules/motion')) {
            return 'motion';
          }
          if (id.includes('node_modules/pdfjs-dist')) {
            return 'pdfjs';
          }
          if (id.includes('node_modules/firebase')) {
            return 'firebase';
          }
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }
          if (
            id.includes('node_modules/lucide-react') ||
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
