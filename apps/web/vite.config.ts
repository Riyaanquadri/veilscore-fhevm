import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const repoRoot = path.resolve(__dirname, "..", "..");

// Custom plugin to serve WASM with correct MIME type
const wasmPlugin: Plugin = {
  name: 'wasm-mime-type',
  configureServer(server) {
    return () => {
      server.middlewares.use((req, res, next) => {
        if (req.url?.endsWith('.wasm')) {
          res.setHeader('Content-Type', 'application/wasm');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        }
        next();
      });
    };
  },
};

export default defineConfig({
  plugins: [react(), wasmPlugin],
  
  // Ensure WASM files are properly recognized and served
  assetsInclude: ['**/*.wasm'],
  
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
      external: [],
    },
  },
});
