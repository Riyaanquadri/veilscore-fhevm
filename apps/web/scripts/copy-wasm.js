#!/usr/bin/env node

/**
 * Copy WASM file from node_modules to public folder
 * This ensures the WASM file is available at /tfhe_bg.wasm during dev and build
 */

const fs = require('fs');
const path = require('path');

// Paths - handle both npm and pnpm structures
const possiblePaths = [
  // Standard npm path
  path.resolve(__dirname, '../../node_modules/@zama-fhe/tfhe-js/dist/browser/tfhe-rs/browser/tfhe_bg.wasm'),
  // pnpm hoisted path (from apps/web/scripts -> ../../../node_modules)
  path.resolve(__dirname, '../../../node_modules/.pnpm/@zama-fhe+tfhe-js@0.1.2/node_modules/@zama-fhe/tfhe-js/dist/browser/tfhe-rs/browser/tfhe_bg.wasm'),
  // Alternative pnpm structure
  path.resolve(__dirname, '../../../node_modules/@zama-fhe/tfhe-js/dist/browser/tfhe-rs/browser/tfhe_bg.wasm'),
];

const publicDir = path.resolve(__dirname, '../public');
const destWasm = path.resolve(publicDir, 'tfhe_bg.wasm');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  console.log(`[WASM Copy] Creating public directory: ${publicDir}`);
  fs.mkdirSync(publicDir, { recursive: true });
}

// Find the source WASM file
let sourceWasm = null;
for (const possiblePath of possiblePaths) {
  if (fs.existsSync(possiblePath)) {
    sourceWasm = possiblePath;
    break;
  }
}

if (!sourceWasm) {
  console.error(`[WASM Copy] ✗ Source WASM not found in any of these locations:`);
  possiblePaths.forEach(p => console.error(`[WASM Copy]   - ${p}`));
  console.error('[WASM Copy] Make sure @zama-fhe/tfhe-js is installed:');
  console.error('[WASM Copy]   cd apps/web && pnpm install');
  process.exit(1);
}

// Copy the file
try {
  const sourceStats = fs.statSync(sourceWasm);
  const destExists = fs.existsSync(destWasm);
  const shouldCopy = !destExists || (sourceStats.mtime > fs.statSync(destWasm).mtime);
  
  if (shouldCopy) {
    fs.copyFileSync(sourceWasm, destWasm);
    console.log(`[WASM Copy] ✓ Copied WASM from node_modules`);
    console.log(`[WASM Copy]   From: ${sourceWasm}`);
    console.log(`[WASM Copy]   To:   ${destWasm}`);
    console.log(`[WASM Copy]   Size: ${(sourceStats.size / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.log(`[WASM Copy] ✓ WASM already up-to-date at: ${destWasm}`);
  }
} catch (err) {
  console.error(`[WASM Copy] ✗ Error copying WASM file:`, err.message);
  process.exit(1);
}
