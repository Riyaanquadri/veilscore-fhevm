# CSP & TFHE WASM Initialization Fix

## The Issue
Your browser's Content Security Policy (CSP) was blocking `unsafe-eval`, which prevented the TFHE WASM JS glue code from initializing properly.

Error shown:
```
TFHE encryption failed: TFHE WASM initialization failed: TfheClientKey and 
TfheConfigBuilder not found after initialization
```

Console error:
```
Content Security Policy of your site blocks the use of 'eval' in JavaScript
```

## Root Cause Identified ✅

The `@zama-fhe/tfhe-js@0.1.2` package contains auto-generated WASM bindings that use `new Function()`:

```javascript
// Location: node_modules/@zama-fhe/tfhe-js/dist/browser/tfhe-rs/browser/tfhe.js
const ret = new Function(getStringFromWasm0(arg0, arg1));
```

This is a standard wasm-bindgen pattern where JS glue code dynamically creates JavaScript functions to wrap WASM exports. The browser blocks this with strict CSP policies.

## Fixes Applied ✅

### 1. **HTML-Level CSP (Development)**
**File:** `apps/web/index.html`

Added a meta tag allowing `unsafe-eval` for dev:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; connect-src 'self' https:; object-src 'none';"/>
```

**Why this works:** Browsers check meta CSP tags before evaluating scripts, so TFHE's `new Function()` calls are now allowed.

**Important:** This is **DEV ONLY**. The `unsafe-eval` weakens security. Do NOT deploy this to production.

### 2. **Vite Server Header (Backup)**
**File:** `apps/web/vite.config.ts`

Added CSP response headers for dev server:
```typescript
server: {
  headers: {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; connect-src 'self' https: wss:; object-src 'none';",
  },
}
```

This ensures even if the HTML meta tag fails, the server header allows eval.

## What to Do Now

### Step 1: Hard Refresh
```
Mac: Cmd + Shift + R
Windows/Linux: Ctrl + Shift + R
```

This clears cached CSP policies.

### Step 2: Test TFHE Initialization
1. Reload `http://localhost:5173`
2. Click the blue **"Open Debug"** button (top-right)
3. Check DevTools Console for:

```
TFHE keys BEFORE init: [Array of exports]
TFHE keys AFTER init: [Array should have TfheClientKey, TfheConfigBuilder, etc.]
TfheClientKey present? true
TfheConfigBuilder present? true
```

### Step 3: Test Full Encryption
1. Close debug panel
2. Fill in signals (followers, tx count)
3. Click **"Compute VeilScore"**
4. Should complete without "Shortint not found" error

## Production Solution (Recommended)

For production, you need a **CSP-safe** approach:

### Option A: Use a Pre-built TFHE Package Without eval (Recommended)

Contact Zama or check their releases for:
- A UMD build that pre-generates all wrappers (no eval needed)
- An ESM build with CSP compatibility flag
- A standalone WASM bundle with pre-compiled glue

**Action:** Email support@zama.ai or check the [Zama GitHub releases](https://github.com/zama-ai/tfhe-rs/releases) for a CSP-safe variant.

### Option B: Narrow CSP to Only Allow Script-Src from Trusted Sources

If you must use `unsafe-eval`, restrict it further:

```html
<!-- Production: narrow CSP, eval only for TFHE -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-eval' https://cdn.example.com; connect-src 'self' https: wss:; object-src 'none'; report-uri https://csp-reporter.example.com"/>
```

This:
- Keeps `unsafe-eval` but limits script sources
- Adds CSP reporting so you can detect violations
- Still not ideal, but better than fully permissive CSP

### Option C: Sandbox TFHE in a Web Worker or iframe

Isolate TFHE in a separate execution context with its own CSP:

```typescript
// Create worker-based TFHE context
const wasmWorker = new Worker('/tfhe-worker.js', { type: 'module' });

// Worker has relaxed CSP, main app keeps strict CSP
// Communication via postMessage (no direct eval in main thread)
```

This requires re-architecting the TFHE integration but provides strong isolation.

### Option D: Use a Different FHE Library

Some FHE libraries may offer CSP-compliant builds:
- Check if other Zama SDKs (fhEVM, fhevm-js) have CSP-safe variants
- Evaluate alternative FHE libraries (tfhe-rs Rust + Wasm without JS glue, etc.)

## Verification Checklist

After the fixes:

- [ ] Hard refresh browser (Cmd+Shift+R)
- [ ] Open DevTools Console
- [ ] Click "Open Debug" button
- [ ] Verify console shows:
  - `TFHE keys BEFORE init: [...]`
  - `TFHE keys AFTER init: [...]`
  - `TfheClientKey present? true`
  - `TfheConfigBuilder present? true`
- [ ] No CSP violation messages
- [ ] Close debug, try encryption operation
- [ ] Verify encryption completes successfully

## Files Changed

1. ✅ `apps/web/index.html` - Added meta CSP with `unsafe-eval`
2. ✅ `apps/web/vite.config.ts` - Added server headers with CSP

## Environment

- TFHE Package: `@zama-fhe/tfhe-js@0.1.2`
- WASM Bindings: Auto-generated via wasm-bindgen (contains `new Function()` calls)
- Dev Server: Vite v5.x

## References

- [Content Security Policy MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Wasm-Bindgen JS Glue Code](https://docs.rs/wasm-bindgen/latest/wasm_bindgen/)
- [Zama TFHE Documentation](https://docs.zama.org/)

## Summary

✅ **Short-term (dev):** CSP modified to allow `unsafe-eval` — TFHE should now initialize.

⚠️ **Before production:** Plan a CSP-safe solution (CSP-friendly build, sandboxing, or alternative library).

---

**Next:** Hard refresh, test the debug component, and confirm TFHE initializes without errors.
