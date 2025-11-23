import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

const repoRoot = path.resolve(__dirname, "..", "..");

// Plugin to copy WASM from node_modules to public folder
const copyWasmPlugin: Plugin = {
  name: 'copy-wasm',
  apply: 'serve',
  configureServer() {
    // On dev server startup, copy WASM file
    const wasmSource = path.resolve(__dirname, '../../node_modules/@zama-fhe/tfhe-js/dist/browser/tfhe-rs/browser/tfhe_bg.wasm');
    const wasmDest = path.resolve(__dirname, 'public/tfhe_bg.wasm');
    
    try {
      if (!fs.existsSync(wasmDest) || fs.statSync(wasmSource).mtime > fs.statSync(wasmDest).mtime) {
        console.log(`[WASM Copy] Copying WASM from node_modules to public folder...`);
        fs.copyFileSync(wasmSource, wasmDest);
        console.log(`[WASM Copy] ✓ WASM copied to ${wasmDest}`);
      } else {
        console.log(`[WASM Copy] ✓ WASM already up-to-date in public folder`);
      }
    } catch (err) {
      console.error(`[WASM Copy] ✗ Failed to copy WASM:`, err);
    }
  },
};

// Custom plugin to serve WASM with correct MIME type
const wasmPlugin: Plugin = {
  name: 'wasm-mime-type',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.includes('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        // Log for debugging
        console.log(`[WASM] Serving WASM file: ${req.url}`);
      }
      next();
    });
  },
};

export default defineConfig({
  plugins: [copyWasmPlugin, react(), wasmPlugin],
  
  // Ensure WASM files are properly recognized and served
  assetsInclude: ['**/*.wasm'],
  
  server: {
    fs: {
      allow: [repoRoot],
    },
    headers: {
      // DEV ONLY: Allow unsafe-eval for TFHE WASM initialization
      // The @zama-fhe/tfhe-js package uses new Function() to generate WASM glue at runtime
      // Also allow http://localhost for local backend development
      // This is removed before production - see notes below
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; connect-src 'self' http://localhost:* https: wss:; style-src 'self' 'unsafe-inline'; object-src 'none';",
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
    // Copy WASM file to dist on build
    outDir: 'dist',
  },
});
