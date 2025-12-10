import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'

export default defineConfig({
  plugins: [wasm()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,
    strictPort: false
  },
  preview: {
    host: '0.0.0.0', // Also listen on all interfaces for preview
    port: 5173
  },
  build: {
    // Ensure proper handling of assets and modules
    rollupOptions: {
      output: {
        // Ensure consistent chunk naming for better caching
        manualChunks: undefined
      }
    }
  }
})
