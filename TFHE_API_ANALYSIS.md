# TFHE.js @0.1.2 API Analysis

## Installed Version
```
@zama-fhe/tfhe-js@0.1.2
```

## Package Structure

### Main Entry Point
- Browser: `dist/browser/src/index.js`
- Node: `dist/node/src/index.js`

### What's Actually Exported

```javascript
// High-level API (what we should use)
export { createKey }                    // Create key from random
export { createKeyFromBase64 }          // Restore key from base64
export { createKeyFromPassPhrase }      // Derive key from passphrase
export { Key }                          // Key class with encrypt/decrypt
export { genSeed }                      // Generate random seed

// Low-level WASM bindings (for advanced use)
export { default as initSDK }           // initSDK === init (WASM init function)
export { TFHERs }                       // Namespace with Shortint classes
  - TFHERs.Shortint
  - TFHERs.ShortintClientKey
  - TFHERs.ShortintCiphertext
  - TFHERs.ShortintCompressedPublicKey
  - TFHERs.init (the actual WASM init function)
  - etc.

// Utils
export { ... } from './errors'
export { ... } from './utils'
```

## KEY FINDING: Missing Classes

❌ **NOT available in this package:**
- `TfheClientKey` (does NOT exist)
- `TfheConfigBuilder` (does NOT exist)

✅ **What's available instead:**
- `Key` - High-level wrapper class
- `ShortintClientKey` - Low-level WASM binding (in TFHERs namespace)
- Shortint types from TFHERs

## The Real API to Use

### High-Level (Recommended - what we should use):
```javascript
import { createKey, Key } from '@zama-fhe/tfhe-js';

// Create a key
const key = createKey();

// Encrypt (input must be bigint)
const ciphertext = key.encrypt(123n);

// Decrypt
const plaintext = key.decrypt(ciphertext);

// Export/Import
const base64Key = key.exportKey();
const restoredKey = createKeyFromBase64({ secretKey: base64Key });
```

### Low-Level (Direct WASM - for compatibility):
```javascript
import { TFHERs, initSDK } from '@zama-fhe/tfhe-js';

// Initialize WASM
await initSDK();

// Use low-level Shortint types
const clientKey = TFHERs.ShortintClientKey.generate(...);
// etc.
```

## Initialization Pattern

```javascript
// initSDK is a function that initializes the WASM module
// It returns: finalizeInit(instance, module)
// Which gives you access to wasm.Shortint, etc.

const TFHE = await import('@zama-fhe/tfhe-js');
const wasmModule = await TFHE.initSDK();

// After init, low-level exports become available
const shortint = TFHE.TFHERs.Shortint;
```

## Why The Code Failed

1. Code expected `TfheClientKey` and `TfheConfigBuilder` - **these don't exist in @0.1.2**
2. Code expected direct WASM class access - **needs `initSDK()` call first**
3. CSP `unsafe-eval` was needed but browser blocked it anyway
4. The high-level `Key` class API was never tried

## Fix Strategy

Replace the low-level TFHE API calls with the high-level `Key` class:

```javascript
// OLD (WRONG - these classes don't exist):
const clientKey = new TfheClientKey(...);
const configBuilder = TfheConfigBuilder.default().build();
// ^ This all fails because they don't exist

// NEW (CORRECT - use Key class):
const key = createKey();
const ciphertext = key.encrypt(myNumber);
```

## WASM Checksum Verification
```
node_modules WASM:  a98b5359d07e457245a9e22f49cf37447fd51578
public WASM:        a98b5359d07e457245a9e22f49cf37447fd51578
✓ Match - same file
```

## Next Steps
1. Rewrite `tfheEncryption.ts` to use `createKey()` and `Key.encrypt()`
2. Remove all references to `TfheClientKey`, `TfheConfigBuilder`
3. Update `encryptSignalsWithTfhe()` to use `key.encrypt()`
4. Test encryption with simple bigint values first
