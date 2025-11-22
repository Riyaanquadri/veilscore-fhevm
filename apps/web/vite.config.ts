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
        // External modules that are loaded at runtime
        // (none currently - @zama-fhe/tfhe-js is bundled from npm)
      ],
    },
  },
});
