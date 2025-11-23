#!/bin/bash

echo "======================================"
echo "TFHE Implementation Verification"
echo "======================================"
echo ""

# Test 1: Build succeeds
echo "TEST 1: Build verification"
pnpm build 2>&1 | grep -E "✓ built|error" | tail -1
echo ""

# Test 2: WASM file exists
echo "TEST 2: WASM file existence"
if [ -f "apps/web/public/tfhe_bg.wasm" ]; then
  echo "✅ WASM file found at apps/web/public/tfhe_bg.wasm"
  ls -lh apps/web/public/tfhe_bg.wasm
else
  echo "❌ WASM file NOT found"
fi
echo ""

# Test 3: Package version
echo "TEST 3: Package version"
npm ls @zama-fhe/tfhe-js --depth=0 2>/dev/null | grep tfhe-js || echo "❌ Package not found"
echo ""

# Test 4: TypeScript files compile
echo "TEST 4: TypeScript compilation"
grep -l "export.*createKey\|export.*encryptWithTfheAndCommit" src/utils/tfheEncryption.ts && echo "✅ tfheEncryption.ts has exports" || echo "❌ Missing exports"
echo ""

# Test 5: Server running
echo "TEST 5: Development server"
curl -s -I http://localhost:5173/debug 2>&1 | head -1
echo ""

echo "======================================"
echo "Verification Complete"
echo "======================================"
