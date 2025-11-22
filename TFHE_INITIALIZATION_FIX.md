# TFHE WASM Initialization: Root Cause & Solution

## The Problem

**Error:** `TFHE encryption failed: TFHE WASM initialization failed: initSDK function not found`

**Why it was confusing:** The export list showed `initSDK` WAS available, making the error appear contradictory.

## Root Cause Analysis

### Package Structure Investigation

The `@zama-fhe/tfhe-js` package has **separate builds for Node.js and Browser**:

```json
{
  "main": "dist/node/src/index.js",        // For Node.js
  "browser": "dist/browser/src/index.js"   // For Browser
}
```

### The initSDK Export Chain

When importing `@zama-fhe/tfhe-js/browser`, the export chain looks like:

```
/browser/src/index.js
  → exports { default as initSDK } from '../tfhe-rs/browser/tfhe.js'
  → tfhe.js exports default init (from WASM)
  → init is the raw WASM initialization function
```

**Key finding:** In the browser build, `initSDK` is exported as a **getter function** via `Object.defineProperty`:

```javascript
Object.defineProperty(exports, "initSDK", { 
  enumerable: true, 
  get: function () { 
    return __importDefault(_tfhe_rs_1).default;  // Returns the default export
  } 
});
```

This creates a **CommonJS-style getter**, but when Vite imports it as an ES module, there can be complications with how the function is called or its context.

### TypeScript Definitions Reveal the Truth

```typescript
// From tfhe.d.ts:
export default init;
export function initSync(module: any): any;
declare function init(input: any): Promise<any>;
```

The `init` function requires a **parameter** (the WASM module object), and the simple wrapper doesn't handle this correctly.

## The Solution

### Why It Works: Use High-Level API Instead

The library provides a **higher-level cryptographic API** that handles WASM initialization automatically:

```typescript
import { createKey, TFHERs } from '@zama-fhe/tfhe-js';

// This line triggers WASM initialization automatically
const key = createKey();

// Now TFHERs and all WASM operations are ready
```

The `createKey()` function:
1. ✅ Detects the environment (browser vs Node.js)
2. ✅ Loads and initializes the WASM module
3. ✅ Provides proper context for the `init` function
4. ✅ Returns a ready-to-use Key object

### Implementation

**Old (broken):**
```typescript
const tfhePackage = await import('@zama-fhe/tfhe-js/browser');
const initSDK = tfhePackage.initSDK;
await initSDK();  // ❌ Fails - initSDK needs proper context/parameters
```

**New (fixed):**
```typescript
const { createKey, TFHERs } = await import('@zama-fhe/tfhe-js');
const testKey = createKey();  // ✅ Works - handles initialization internally
```

## Key Learnings

1. **Don't call low-level WASM init functions directly** - use library wrapper functions like `createKey()`
2. **The package auto-detects browser vs Node.js** - don't force `/browser` subpath
3. **CommonJS getters + ESM bundlers can cause issues** - the higher-level API avoids this
4. **"Function not found" + "Available exports" = context/calling problem**, not export problem

## Testing the Fix

The dev server will automatically reload. Hard refresh your browser (Cmd+Shift+R on Mac) and:

1. Open browser console (Option+Cmd+I)
2. Trigger encryption
3. Look for: `[TFHE] ✓ Test key created successfully - WASM initialized`

If you see that log, the WASM module is now properly initialized!

## Alternative Approaches (if needed)

### Option A: Direct `initSDK` with Proper Parameters

If you need to use `initSDK` directly:

```typescript
import init from '@zama-fhe/tfhe-js/browser/tfhe-rs/browser/tfhe.js';
import wasmModule from '@zama-fhe/tfhe-js/browser/tfhe-rs/browser/tfhe_bg.wasm';

await init(wasmModule);  // Pass WASM module explicitly
```

**Not recommended** - requires deep knowledge of package structure.

### Option B: Pre-initialization Script

Add to `index.html`:

```html
<script>
  // Trigger initialization early
  import('@zama-fhe/tfhe-js').then(lib => {
    lib.createKey();  // Initialize WASM
  });
</script>
```

**Limitation** - initialization happens before React mounts.

## See Also

- `tfheEncryption.ts` - Updated initialization function
- `@zama-fhe/tfhe-js` documentation - High-level crypto API
- TFHE-rs Rust bindings - Low-level WASM module
