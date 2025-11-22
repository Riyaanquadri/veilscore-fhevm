import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const repoRoot = path.resolve(__dirname, "..", "..");

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
  resolve: {
    // Polyfill for Node.js modules needed by @zama-fhe/tfhe-js in browser
    alias: {
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Handle ESM/CommonJS interop for TFHE WASM
      define: {
        global: 'globalThis',
      },
    },
    include: ['@zama-fhe/tfhe-js'],
  },
  build: {
    rollupOptions: {
      external: [
        // External modules that are loaded at runtime
        // (none currently - @zama-fhe/tfhe-js is bundled from npm)
      ],
    },
  },
});
