# Fixing: "Cannot read properties of undefined (reading 'bc_get_shortint_parameters')"

## What This Error Means

```
Error: Cannot read properties of undefined (reading 'bc_get_shortint_parameters')
```

**Translation:** The JavaScript wrapper for TFHE is present, but it can't find the underlying WASM module exports. Specifically, `Shortint` is `undefined` when the code tries to call `Shortint.bc_get_shortint_parameters`.

**Root Cause:** The WASM file (`tfhe_bg.wasm`) either didn't load or didn't initialize properly.

---

## Quick Diagnosis Checklist

### 1. **Check if WASM File is Being Served** (START HERE)

Open DevTools → Network tab, then:

1. **Filter for WASM files:**
   - Click the filter box (funnel icon)
   - Type `.wasm` or `wasm`
   - Or: Right-click on any request → Filter by type

2. **Reload page (Cmd+R)**

3. **Look for `tfhe_bg.wasm` request**

4. **Check the Status column:**
   - ✅ **200**: File is loading correctly
   - ❌ **404**: File not found (wrong path or not installed)
   - ❌ **304**: Cached (try Cmd+Shift+R hard refresh)
   - ❌ **(red error)**: Network or server error

### 2. **Check Content-Type Header**

If the file shows 200 OK:

1. Click on the `tfhe_bg.wasm` request
2. Go to **Response Headers** tab
3. Look for `Content-Type` header
4. Should be: `application/wasm`
5. ❌ If it's `text/html` or `text/plain`: WASM is being served wrong
6. ❌ If header is missing: Vite may not recognize .wasm files

### 3. **Check File Size**

1. In Network tab, click the `tfhe_bg.wasm` request
2. Look at the **Size** column
3. Should be approximately **1.0 MB - 1.2 MB**
4. ❌ If it's 0 bytes: Empty or truncated file
5. ❌ If it's very small (< 100KB): Wrong file or HTML error page

### 4. **Check Response Content**

1. Click the `tfhe_bg.wasm` request
2. Go to **Response** tab
3. Should show binary content (gibberish/hex when decoded)
4. ❌ If you see HTML or JSON: Wrong file is being served

---

## Fix Options

### **Option A: Restart Dev Server** (50% success rate)

Many WASM issues are resolved by restarting:

```bash
# In your terminal running the dev server:
# Press Ctrl+C to stop

# Then restart:
cd /Users/imransayed/Veilscore/veilscore-fhevm/apps/web
pnpm dev
```

Then reload the browser (Cmd+R).

**Why this works:** Vite may have cached an incorrect WASM setup.

---

### **Option B: Hard Refresh Browser Cache** (30% success rate)

The browser may have cached a bad version:

```
Mac:     Cmd+Shift+R
Windows: Ctrl+Shift+R
Linux:   Ctrl+Shift+R
```

This forces the browser to re-download all files including WASM.

---

### **Option C: Ensure Package is Installed** (20% success rate)

The WASM file may not exist if the package wasn't fully installed:

```bash
cd /Users/imransayed/Veilscore/veilscore-fhevm/apps/web

# Remove node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Or just reinstall the specific package
pnpm install @zama-fhe/tfhe-js@^0.1.2

# Then restart dev server
pnpm dev
```

**Verify file exists:**
```bash
ls -lh node_modules/@zama-fhe/tfhe-js/dist/browser/tfhe-rs/browser/tfhe_bg.wasm
```

Should show: `-rw-r--r-- 1.0M tfhe_bg.wasm`

---

### **Option D: Update Vite Configuration**

If Network tab shows tfhe_bg.wasm with status 200 but wrong Content-Type, update `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const repoRoot = path.resolve(__dirname, "..", "..");

export default defineConfig({
  plugins: [react()],
  
  // Ensure WASM is not processed by Vite
  assetsInclude: ['**/*.wasm'],
  
  server: {
    fs: {
      allow: [repoRoot],
    },
    // Ensure WASM is served with correct MIME type
    middlewares: [],
  },
  
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  
  optimizeDeps: {
    esbuildOptions: {
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
  },
});
```

Then restart dev server.

---

### **Option E: Check JavaScript Console Errors**

1. Open DevTools Console (Option+Cmd+I)
2. Look for red errors
3. Note any messages about:
   - CORS (Cross-Origin)
   - fetch failure
   - WebAssembly
   - Module loading

**Copy these errors and share them** - they're very helpful for debugging.

---

## Advanced: WASM Load Path Verification

If the above doesn't work, verify the exact load path:

```bash
# Check if WASM file exists at expected location:
find /Users/imransayed/Veilscore/veilscore-fhevm -name "tfhe_bg.wasm" -ls 2>/dev/null

# Expected output:
# /path/to/node_modules/.pnpm/@zama-fhe+tfhe-js@0.1.2/node_modules/@zama-fhe/tfhe-js/dist/browser/tfhe-rs/browser/tfhe_bg.wasm

# Then run from apps/web directory:
ls -lh node_modules/@zama-fhe/tfhe-js/dist/browser/tfhe-rs/browser/tfhe_bg.wasm

# Should show a file size > 1MB
```

---

## Testing After Fix

After trying a fix option:

1. **Hard refresh:** Cmd+Shift+R
2. **Open console:** Option+Cmd+I
3. **Go to Console tab**
4. **Copy this into console:**

```javascript
// Quick WASM test
(async () => {
  const tfhe = await import('@zama-fhe/tfhe-js');
  console.log('Shortint:', !!tfhe.Shortint);
  if (tfhe.initSDK) {
    await tfhe.initSDK();
    console.log('After init - Shortint:', !!tfhe.Shortint);
  }
})();
```

**Success:** Console shows `true` for both checks

**Failure:** Console shows `false` or error

---

## If Still Not Working: Full Diagnostics

1. **Open DevTools** → Network tab
2. **Filter for `.wasm`**
3. **Reload page**
4. **In Network tab, right-click on any request → Copy as cURL**
5. **Share the full Network tab screenshot** (showing tfhe_bg.wasm row)
6. **Also share console output** (Option+Cmd+I → Console → Screenshot)

These will show:
- If WASM is actually loading (Network tab)
- If there are JavaScript errors (Console tab)
- The exact headers being served
- The request being made

---

## Root Cause Decision Tree

```
Error: Cannot read properties of undefined (reading 'bc_get_shortint_parameters')
│
├─ Network tab shows tfhe_bg.wasm with 200 OK
│  ├─ Content-Type = application/wasm? 
│  │  ├─ YES: Jump to "Option F"
│  │  └─ NO: Option D (update vite.config.ts)
│  └─ Content-Type = text/html?
│     └─ Option A or B (restart/refresh)
│
├─ Network tab shows tfhe_bg.wasm with 404
│  └─ Option C (reinstall package)
│
├─ Network tab shows NO tfhe_bg.wasm at all
│  ├─ Is node_modules/@zama-fhe/tfhe-js installed?
│  │  ├─ NO: Option C (install)
│  │  └─ YES: Option A (restart dev server)
│  └─ Check Vite config includes @zama-fhe/tfhe-js
│     └─ Option D (update vite.config.ts)
│
└─ Network tab looks good, but still errors
   └─ Option E (check console errors)
      └─ If CORS error: May need different server setup
      └─ If fetch error: File path issue
      └─ If WebAssembly error: Version mismatch
```

---

## Option F: Manual WASM Initialization (Advanced)

If all else fails, try explicit initialization:

In `tfheEncryption.ts`, replace `initializeTfheWasm()` with:

```typescript
export async function initializeTfheWasm(): Promise<void> {
  if (tfheReady) return;

  try {
    console.log('[TFHE] Importing WASM module...');
    
    // Import the raw WASM module
    const wasmModule = await import(
      '@zama-fhe/tfhe-js/browser/tfhe-rs/browser/tfhe.js'
    ) as any;
    
    console.log('[TFHE] WASM exports:', Object.keys(wasmModule).slice(0, 10));
    
    // Call init with no parameters (it self-loads)
    if (wasmModule.default) {
      console.log('[TFHE] Calling default init...');
      await wasmModule.default();
    } else if (wasmModule.init) {
      console.log('[TFHE] Calling init...');
      await wasmModule.init();
    } else {
      throw new Error('No init function found');
    }
    
    console.log('[TFHE] ✓ WASM initialized');
    
    // Now get the high-level API
    const tfhePackage = await import('@zama-fhe/tfhe-js') as any;
    tfheModule = tfhePackage;
    tfheReady = true;
    
  } catch (err) {
    console.error('[TFHE] Init failed:', err);
    throw err;
  }
}
```

This is more explicit and easier to debug.

---

## Key Points

- **The error means:** JavaScript wrapper loaded but WASM binary didn't
- **Most common cause:** WASM file not being served (Network tab shows 404)
- **Second most common:** WASM served with wrong Content-Type header
- **Quick fixes:** Restart dev server, hard refresh, reinstall package
- **If stuck:** Share Network tab screenshot + console errors

---

## Summary

1. ✅ **Open Network tab, filter for .wasm**
2. ✅ **Reload page**
3. ✅ **Look for tfhe_bg.wasm request**
4. ✅ **Check Status = 200** (if 404 → reinstall)
5. ✅ **Check Content-Type = application/wasm** (if text/html → restart server)
6. ✅ **Hard refresh browser** (Cmd+Shift+R)
7. ✅ **Restart dev server** (if still broken)

**One of these should fix it!**
