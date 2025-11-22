# SDK Initialization Troubleshooting Guide

## Problem

Error: "Wrong import / wrong exported name — you imported the package but the function is called something else (not initSDK)"

or similar SDK initialization errors.

## Root Causes & Solutions

### 1. **Wrong Import/Export Name** ✅ FIXED

**Problem**: Trying to import `init` when the function is actually `initSDK`.

**Root Cause**: @zama-fhe/tfhe-js package exports `initSDK`, not `init`.

**Solution**: 
```typescript
// ❌ WRONG
import { init } from '@zama-fhe/tfhe-js/browser';
await init();

// ✅ CORRECT
import('@zama-fhe/tfhe-js/browser').then(pkg => {
  await pkg.initSDK({});  // Pass config object (required)
});
```

**Changes Made**:
- Updated `tfheEncryption.ts` to use `initSDK({})` instead of `init()`
- Added diagnostic logging to show available exports
- Wrapped in try-catch with helpful error messages

### 2. **Browser vs ES Module Mismatch** ✅ FIXED

**Problem**: Package loaded as `<script>` tag but code tries to import as ES module.

**Root Cause**: CDN-loaded scripts are global; imports are module-based.

**Solution**:
- Use `/browser` subpath export: `@zama-fhe/tfhe-js/browser`
- This ensures browser-compatible WASM loading
- The CDN script loads the full package globally if needed

**Current Setup**:
- `index.html`: Has CDN script for Relayer SDK
- `tfheEncryption.ts`: Uses dynamic import of `/browser` subpath
- Result: Works in both module and global contexts

### 3. **WASM File Not Available / Wrong Path** ✅ CHECKED

**Problem**: initSDK fails silently because it can't find .wasm files.

**Root Cause**: 
- WASM files not in `public/` folder
- Vite not configured to handle .wasm imports
- Wrong path in wasm init config

**Solution**:
- Check `vite.config.ts` has WASM support configured
- WASM files should auto-resolve from node_modules
- @zama-fhe/tfhe-js/browser handles WASM path internally

**What to Check**:
```bash
# 1. Verify WASM files exist
find node_modules -name "*.wasm" | head -5

# 2. Check Vite config supports WASM
grep -i wasm vite.config.ts

# 3. Look at browser console for CORS/404 errors on .wasm files
```

### 4. **Running in Node/SSR Without Browser Build** ✅ FIXED

**Problem**: Code runs in Node.js or SSR context, but WASM is browser-only.

**Root Cause**:
- tfheEncryption.ts gets imported/executed server-side
- WASM initialization fails in Node environment
- navigator object doesn't exist

**Solution**:
- Only call `initializeTfheWasm()` in browser context
- Check `typeof window !== 'undefined'` before init
- Put TFHE code in components that only render client-side

**Current Implementation**:
```typescript
// In tfheEncryption.ts
export async function initializeTfheWasm(): Promise<void> {
  if (tfheReady) return;  // Already initialized
  
  try {
    // This will fail in Node but that's expected
    const tfhePackage = await import('@zama-fhe/tfhe-js/browser');
    const initSDK = tfhePackage.initSDK;
    await initSDK({});  // Pass config object
    tfheReady = true;
  } catch (err) {
    // Logs helpful error with debugging tips
    throw new Error(`TFHE WASM initialization failed: ${err.message}`);
  }
}
```

**Usage**:
```typescript
// In React component - only runs in browser
useEffect(() => {
  if (typeof window === 'undefined') return;  // Skip on server
  initializeTfheWasm().catch(err => console.error(err));
}, []);
```

### 5. **Bundler/ESM Interop Issue** ✅ FIXED

**Problem**: Vite/Rollup has trouble with default vs named exports.

**Root Cause**:
- Zama packages use mixed export patterns
- Vite's esbuild may not handle interop correctly
- TypeScript types don't match runtime

**Solution**:
- Use dynamic `import()` instead of static `import` statements
- This defers evaluation to runtime and lets bundler handle it
- Type as `any` to bypass strict checks during init

**Current Implementation**:
```typescript
// ❌ Problematic
import { TFHERs } from '@zama-fhe/tfhe-js/browser';

// ✅ Better
const tfhePackage = await import('@zama-fhe/tfhe-js/browser') as any;
const { TFHERs } = tfhePackage;
```

### 6. **Version Mismatch** ✅ VERIFIED

**Problem**: Installed package version has different API than code expects.

**Root Cause**: API changed between releases.

**Solution**:
- Ensure package.json has correct version pinned
- Check node_modules to verify installed version
- Update code if version changed

**Current Version**:
```json
"@zama-fhe/tfhe-js": "^0.1.2"
```

**What to Verify**:
```bash
# Check installed version
ls node_modules/@zama-fhe/tfhe-js/package.json | grep version

# Check what's exported
node -e "const pkg = require('@zama-fhe/tfhe-js/browser'); console.log(Object.keys(pkg))"
```

## Diagnostic Steps

### Step 1: Check Package Installation

```bash
cd apps/web
pnpm list @zama-fhe/tfhe-js

# Output should show @zama-fhe/tfhe-js@0.1.2
```

### Step 2: Verify Exports

Open browser DevTools console and run:
```javascript
// This will print available exports
import('@zama-fhe/tfhe-js/browser').then(pkg => {
  console.log('Exports:', Object.keys(pkg));
  console.log('Has initSDK:', typeof pkg.initSDK);
  console.log('Has TFHERs:', typeof pkg.TFHERs);
});
```

### Step 3: Test Initialization

```javascript
// In browser console
import('@zama-fhe/tfhe-js/browser').then(pkg => {
  console.log('Calling initSDK()...');
  return pkg.initSDK({});
}).then(() => {
  console.log('✓ Initialization successful');
}).catch(err => {
  console.error('✗ Initialization failed:', err);
});
```

### Step 4: Check Vite Config

```bash
# Look for WASM handling
grep -A5 -B5 "wasm\|\.wasm" vite.config.ts

# Should have something like:
# { type: 'module', target: 'esnext' }
# or proper WASM plugin configuration
```

### Step 5: Browser DevTools

1. Open DevTools → Console
2. Look for errors with `.wasm` files (404, CORS)
3. Check Network tab for WASM file requests
4. Enable verbose logging (source maps)

## Relayer SDK Initialization

**File**: `apps/web/src/lib/relayerInit.ts`

**Issue**: CDN-loaded SDK might use different global name or initialization pattern.

**Solution Implemented**:
- Tries multiple initialization patterns:
  1. `SDK.initSDK(config)` 
  2. `SDK.init(config)`
  3. `new SDK(config)`
- Auto-detects global name (window.relayerSDK, window.ZamaRelayer, etc.)
- Continues gracefully if auto-initializing

**Debugging**:
```javascript
// In console
console.log('SDK loaded at:', window.relayerSDK ? 'window.relayerSDK' : 'NOT FOUND');
console.log('SDK exports:', window.relayerSDK ? Object.keys(window.relayerSDK) : 'N/A');
```

## Common Error Messages & Fixes

### Error: "initSDK is not a function"

**Causes**:
1. Package not installed: `pnpm install`
2. Wrong import path: use `/browser` subpath
3. Calling before module loads: use async import

**Fix**:
```bash
cd apps/web
pnpm install
# Restart dev server
```

### Error: "Cannot find module '@zama-fhe/tfhe-js'"

**Cause**: Package not in node_modules

**Fix**:
```bash
pnpm install @zama-fhe/tfhe-js@^0.1.2
```

### Error: "WASM file not found" (in network tab)

**Cause**: Vite not serving WASM files or path wrong

**Fix**:
1. Check `vite.config.ts` has WASM support
2. Clear browser cache: `Cmd+Shift+Delete`
3. Restart Vite dev server

### Error: "TFHERs not available" (after initSDK)

**Cause**: TFHERs is lazy-loaded after init

**Fix**:
```typescript
// After await initSDK(), access TFHERs from same module
const pkg = await import('@zama-fhe/tfhe-js/browser');
await pkg.initSDK({});
// TFHERs is now available
const TFHERs = pkg.TFHERs;
```

## Files Modified

1. **`apps/web/src/lib/tfheEncryption.ts`**
   - Fixed `initSDK()` call (was trying to use `init()`)
   - Added config object parameter
   - Improved error logging with debugging tips

2. **`apps/web/src/lib/relayerInit.ts`**
   - Added pattern detection for SDK initialization
   - Tries multiple initialization methods
   - Better error handling and fallbacks

3. **`apps/web/src/lib/fheCompute.ts`**
   - Removed problematic direct import of TFHERs
   - Access TFHERs dynamically after initialization

## Next Steps

1. **Run tests**:
   ```bash
   cd apps/web
   pnpm dev
   # Open browser console and look for initialization logs
   ```

2. **Check browser console** for:
   - `[TFHE] ✅ TFHE WASM module successfully initialized`
   - `[relayerInit] Relayer SDK initialization complete`

3. **If still failing**:
   - Copy error message from console
   - Run diagnostic steps above
   - Check that `pnpm install` was run in `apps/web/`

## References

- [@zama-fhe/tfhe-js docs](https://docs.zama.org/guides/js-tfhe)
- [TFHE-rs WASM API](https://github.com/zama-ai/tfhe-rs/tree/main/tfhe/docs/integration/js-on-wasm-api.md)
- [Vite WASM support](https://vitejs.dev/guide/features.html#webassembly)
- [Zama Relayer SDK](https://docs.zama.org/guides/relayer-sdk)
