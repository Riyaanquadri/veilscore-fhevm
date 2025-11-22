# SDK Initialization Fixes — Summary

## Issues Fixed

### 1. ❌ Wrong Export Name: `initSDK` vs `init`

**Problem**: Code was trying to use `init()` when package exports `initSDK()`

**File**: `apps/web/src/lib/tfheEncryption.ts`

**Fix**:
```typescript
// Before (WRONG):
const init = tfheModule.init;  // Doesn't exist!
await init();

// After (CORRECT):
const initSDK = tfheModule.initSDK;  // Actually exported
await initSDK({});  // Pass config object (required parameter)
```

**Root Cause**: Version 0.1.2 of @zama-fhe/tfhe-js exports `initSDK`, not `init`.

---

### 2. ❌ Missing Required Parameter

**Problem**: `initSDK()` was called with no arguments, but requires a config object

**File**: `apps/web/src/lib/tfheEncryption.ts`

**Fix**:
```typescript
// Before (WRONG):
await initSDK();  // Missing required parameter

// After (CORRECT):
await initSDK({});  // Pass empty config (uses defaults)
```

---

### 3. ❌ Problematic Direct Import of TFHERs

**Problem**: Importing TFHERs before WASM is initialized fails at module load time

**File**: `apps/web/src/lib/fheCompute.ts`

**Fix**:
```typescript
// Before (WRONG):
import { TFHERs } from '@zama-fhe/tfhe-js/browser';
// ↑ Tries to access TFHERs immediately, before initSDK()

// After (CORRECT):
// Remove this import
// Access TFHERs dynamically after initializeTfheWasm() is called
```

**Explanation**: TFHERs is only available AFTER `initSDK()` completes. Static imports happen before that.

---

### 4. ❌ Relayer SDK Initialization Fragile

**Problem**: Only tried `initSDK()` pattern, but CDN SDK might use different init methods

**File**: `apps/web/src/lib/relayerInit.ts`

**Fix**:
```typescript
// Added pattern detection and fallbacks:
if (typeof window.relayerSDK.initSDK === 'function') {
  await window.relayerSDK.initSDK(initOptions);
} else if (typeof window.relayerSDK.init === 'function') {
  await window.relayerSDK.init(initOptions);
} else if (typeof window.relayerSDK === 'function') {
  window.relayerSDK = new window.relayerSDK(initOptions);
}
```

**Benefit**: Handles multiple SDK versions/implementations gracefully

---

## Enhanced Error Handling

### Better Diagnostic Logging

**Added to tfheEncryption.ts**:

```typescript
console.log('[TFHE] Available exports:', Object.keys(tfhePackage).slice(0, 20));
// Shows what's actually exported so we can see the problem

console.log('[TFHE] ✅ TFHE WASM module successfully initialized');
// Clear success indicator

// On error:
console.error('[TFHE] Debugging tips:\n' +
  '1. Package not installed: run `cd apps/web && pnpm install`\n' +
  '2. Wrong version: check that @zama-fhe/tfhe-js@^0.1.2 is in package.json\n' +
  '3. Vite config: ensure vite.config.ts handles .wasm files\n' +
  '...'
);
```

### Better Relayer SDK Diagnostics

**Added to relayerInit.ts**:

```typescript
// Shows where SDK was found
console.log(`[relayerInit] Found SDK at window.${name}`);

// Lists available methods
console.log('[relayerInit] Available methods:', Object.keys(window.relayerSDK));

// Continues gracefully if init is auto-handled
console.log('[relayerInit] Proceeding with SDK as-is (may auto-initialize)');
```

---

## Testing the Fixes

### Verification Checklist

- [ ] Browser console shows: `[TFHE] ✅ TFHE WASM module successfully initialized`
- [ ] Browser console shows: `[relayerInit] Relayer SDK initialization complete`
- [ ] No red errors in console related to SDK init
- [ ] Frontend loads at http://localhost:5173 without hanging
- [ ] Can enter data in the form without console errors

### Quick Test in Browser Console

```javascript
// Test TFHE
import('@zama-fhe/tfhe-js/browser').then(pkg => {
  console.log('✓ Package imports OK');
  console.log('✓ Has initSDK:', typeof pkg.initSDK === 'function');
  return pkg.initSDK({});
}).then(() => {
  console.log('✓ initSDK() completed successfully');
}).catch(err => {
  console.error('✗ Failed:', err.message);
});
```

---

## Files Modified

| File | Change | Reason |
|------|--------|--------|
| `apps/web/src/lib/tfheEncryption.ts` | Fixed `initSDK({})` call | Wrong function name and missing parameter |
| `apps/web/src/lib/relayerInit.ts` | Added init pattern detection | Handle multiple SDK versions |
| `apps/web/src/lib/fheCompute.ts` | Removed direct TFHERs import | Import before init was failing |

---

## Documentation Added

1. **`docs/SDK_INITIALIZATION_TROUBLESHOOTING.md`** (NEW)
   - Root cause analysis for each issue
   - Diagnostic steps
   - Common errors and fixes
   - References to official docs

2. **`docs/QUICK_START.md`** (UPDATED)
   - Added troubleshooting section for SDK issues
   - Better error handling guidance
   - Quick reference for common problems

---

## Version Compatibility

- **@zama-fhe/tfhe-js**: ^0.1.2 ✓
  - Exports: `initSDK`, `TFHERs`, `Key`, etc.
  - Requires: `await initSDK({})` (with config object)

- **Relayer SDK**: Latest from CDN
  - Global: `window.relayerSDK`
  - May auto-init or require explicit init

---

## What to Do Now

### 1. Test Locally
```bash
pnpm install
pnpm dev
# Check browser console for ✅ messages
```

### 2. If Issues Persist
- Check browser console logs (very detailed now)
- Read `docs/SDK_INITIALIZATION_TROUBLESHOOTING.md`
- Run diagnostic commands from there

### 3. On Sepolia Deployment
All SDK fixes apply to Sepolia as well — use same code

---

## Key Takeaway

**The issue**: Mismatched function names (`init` vs `initSDK`) + missing parameters

**The fix**: Use actual exported names + pass required config object

**Why it was hard to find**: Error messages were generic; now we have specific logging
