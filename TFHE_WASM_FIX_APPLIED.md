# TFHE WASM Initialization Error - Fix Applied

## Problem
```
TFHE encryption failed: TFHE WASM initialization failed: Shortint not found after initialization. 
This means the WASM module did not load properly.
```

## Root Causes
1. **Vite middleware configuration error** - The WASM middleware was using a callback that returned nothing, breaking the middleware chain
2. **Missing WASM MIME type headers** - The WASM file wasn't being served with `Content-Type: application/wasm`
3. **WASM file location issues** - The tfhe_bg.wasm file from node_modules wasn't being copied to public folder on dev startup
4. **Initialization logic** - The TFHE module initialization needed better fallback paths and export checking

## Solutions Applied

### 1. Fixed Vite Configuration (`apps/web/vite.config.ts`)

#### Problem:
```typescript
configureServer(server) {
  return () => {  // ❌ This was wrong - doesn't work correctly
    server.middlewares.use((req, res, next) => {
      // middleware code
      next();
    });
  };
}
```

#### Solution:
```typescript
configureServer(server) {
  server.middlewares.use((req, res, next) => {
    if (req.url?.includes('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      console.log(`[WASM] Serving WASM file: ${req.url}`);
    }
    next();
  });
}
```

**Benefits:**
- ✅ Correctly serves WASM with `application/wasm` MIME type
- ✅ Adds CORS headers for proper cross-origin access
- ✅ Logs WASM requests for debugging

### 2. Added WASM Copy Plugin (`apps/web/vite.config.ts`)

Created automatic WASM copying on dev server startup:

```typescript
const copyWasmPlugin: Plugin = {
  name: 'copy-wasm',
  apply: 'serve',
  configureServer() {
    const wasmSource = path.resolve(__dirname, '../../node_modules/@zama-fhe/tfhe-js/dist/browser/tfhe-rs/browser/tfhe_bg.wasm');
    const wasmDest = path.resolve(__dirname, 'public/tfhe_bg.wasm');
    
    if (!fs.existsSync(wasmDest) || fs.statSync(wasmSource).mtime > fs.statSync(wasmDest).mtime) {
      fs.copyFileSync(wasmSource, wasmDest);
      console.log(`[WASM Copy] ✓ WASM copied to ${wasmDest}`);
    }
  },
};
```

**Benefits:**
- ✅ Automatically copies WASM from node_modules to public folder
- ✅ Only copies if source is newer (efficient)
- ✅ Ensures WASM is always available during dev

### 3. Created WASM Copy Script (`apps/web/scripts/copy-wasm.js`)

Standalone script that handles both npm and pnpm package manager structures:

```bash
node scripts/copy-wasm.js
```

Features:
- ✅ Handles pnpm's hoisted node_modules structure
- ✅ Finds WASM in multiple possible locations
- ✅ Reports clear errors if WASM not found
- ✅ Can be run manually or via npm scripts

### 4. Updated Package Scripts (`apps/web/package.json`)

```json
{
  "scripts": {
    "prebuild": "node scripts/copy-wasm.js",
    "dev": "node scripts/copy-wasm.js && vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Benefits:**
- ✅ WASM is copied before dev server starts
- ✅ WASM is copied before build
- ✅ Explicit pre-build step ensures clean builds

### 5. Enhanced TFHE Initialization (`apps/web/src/lib/tfheEncryption.ts`)

#### Improvements:

**Better initialization fallback logic:**
```typescript
// Try different initialization methods in order
if (typeof init === 'function') {
  // Try with wasmUrl parameter
  initResult = await init({ wasmUrl: '/tfhe_bg.wasm' });
} else if (typeof initSDK === 'function') {
  // Try initSDK variant
  initResult = await initSDK({ wasmUrl: '/tfhe_bg.wasm' });
}
```

**Better export verification:**
```typescript
// Check for multiple export paths
const { Shortint: ShortintAfterInit, Key: KeyAfterInit, TfheClientKey, TfheConfigBuilder } = tfheUpdated;

if (!TfheClientKey || !TfheConfigBuilder) {
  // Check alternative export paths
  const altClientKey = tfheUpdated.TFHERs?.TfheClientKey || tfheUpdated.ClientKey;
  const altConfigBuilder = tfheUpdated.TFHERs?.TfheConfigBuilder || tfheUpdated.ConfigBuilder;
}
```

**Enhanced diagnostic messaging:**
- Clear indication of what failed
- Step-by-step debugging instructions
- Suggestions for fixing issues

### 6. Added HTML Diagnostics (`apps/web/index.html`)

```html
<script>
  // Diagnostic script to verify WASM accessibility
  console.log('[WASM Diagnostic] Checking WASM file accessibility...');
  fetch('/tfhe_bg.wasm', { method: 'HEAD' })
    .then(res => {
      console.log(`[WASM Diagnostic] ✓ HEAD /tfhe_bg.wasm: ${res.status}`);
      console.log(`[WASM Diagnostic]   Content-Type: ${res.headers.get('content-type')}`);
    })
    // ... fallback to GET if HEAD fails
</script>
```

**Benefits:**
- ✅ Early diagnostics before app loads
- ✅ Shows WASM file status and headers immediately
- ✅ Helps identify CORS/MIME type issues

## Diagnostic Checklist

If you still see TFHE initialization errors, follow these steps:

### Step 1: Check WASM File Accessibility
Open browser DevTools → Console (you should see):
```
[WASM Diagnostic] ✓ HEAD /tfhe_bg.wasm: 200
[WASM Diagnostic]   Content-Type: application/wasm
```

If Status is not 200:
- Check Network tab for `/tfhe_bg.wasm`
- If 404: File not in public folder, run `node apps/web/scripts/copy-wasm.js`
- If 200 but Content-Type is wrong: Server not applying WASM middleware

### Step 2: Check TFHE Module Loading
In browser console, look for:
```
[TFHE] ========== WASM Initialization ==========
[TFHE] Step 1: Importing TFHE package...
[TFHE] ✓ Package imported
[TFHE] Step 3: Initializing WASM module...
[TFHE] ✅ TFHE WASM module successfully initialized
```

### Step 3: Verify Exports
Check that these are available:
```
[TFHE] - TfheClientKey available: true
[TFHE] - TfheConfigBuilder available: true
```

### Step 4: Hard Refresh
If everything looks good but still failing:
- Mac: `Cmd + Shift + R`
- Windows/Linux: `Ctrl + Shift + R`
- This clears service worker cache

## Manual Testing

### Test 1: WASM File is Served
```bash
# In another terminal
curl -I http://localhost:5173/tfhe_bg.wasm
# Should see:
# HTTP/1.1 200 OK
# Content-Type: application/wasm
```

### Test 2: WASM Copy Script Works
```bash
cd apps/web
node scripts/copy-wasm.js
# Should output: [WASM Copy] ✓ WASM already up-to-date at: ...
```

### Test 3: Dev Server Starts Correctly
```bash
cd apps/web
npm run dev
# Should see: [WASM Copy] ✓ WASM copied to...
# Then: Vite dev server ready
```

## Files Modified

1. ✅ `apps/web/vite.config.ts` - Fixed middleware, added copy plugin
2. ✅ `apps/web/src/lib/tfheEncryption.ts` - Enhanced initialization logic
3. ✅ `apps/web/index.html` - Added diagnostic script
4. ✅ `apps/web/package.json` - Added WASM copy script references
5. ✅ `apps/web/scripts/copy-wasm.js` - New file, WASM copy utility

## Deployment Notes

### Development (`npm run dev`)
- ✅ WASM automatically copied on startup
- ✅ Served with correct MIME types
- ✅ Available at `/tfhe_bg.wasm`

### Production Build (`npm run build`)
- ✅ WASM copied as pre-build step
- ✅ Should be included in dist folder
- ✅ Ensure production server serves WASM with `application/wasm` MIME type

### Production Server Configuration

If using nginx:
```nginx
location ~ \.wasm$ {
  types {
    application/wasm wasm;
  }
  add_header Access-Control-Allow-Origin "*";
}
```

If using Express:
```javascript
app.get('*.wasm', (req, res) => {
  res.setHeader('Content-Type', 'application/wasm');
  next();
});
```

## Verification

After applying these fixes:

1. ✅ Start dev server: `npm run dev` in `apps/web`
2. ✅ Open `http://localhost:5173`
3. ✅ Check browser console for diagnostic messages
4. ✅ Look for `[TFHE] ✅ TFHE WASM module successfully initialized`
5. ✅ Try encrypt operation - should complete without Shortint errors

## References

- [TFHE-rs Documentation](https://docs.zama.org/guides/js-tfhe)
- [Zama fHEVM Integration](https://docs.zama.org/)
- [Vite Configuration Guide](https://vitejs.dev/config/)
- [WASM Debugging Tips](https://developer.mozilla.org/en-US/docs/WebAssembly/Debugging_WebAssembly)
