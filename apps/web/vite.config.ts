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
  build: {
    rollupOptions: {
      external: [
        // @zama-fhe/tfhe-js is loaded dynamically at runtime
        // It's included via CDN in index.html, not as an npm package
        // Mark as external to prevent build errors
        '@zama-fhe/tfhe-js',
      ],
    },
  },
});
