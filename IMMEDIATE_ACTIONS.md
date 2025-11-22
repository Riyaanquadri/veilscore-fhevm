# TFHE WASM: bc_get_shortint_parameters Error - Immediate Actions

## The Error
```
Cannot read properties of undefined (reading 'bc_get_shortint_parameters')
```

## What It Means
WASM JavaScript wrapper loaded, but the WASM binary (`tfhe_bg.wasm`) didn't initialize → `Shortint` is undefined.

---

## 🎯 Do This Now (5 minutes)

### Step 1: Check Network Tab (1 min)
1. Open DevTools: **Option+Cmd+I**
2. Go to **Network** tab
3. **Filter for `.wasm`** (type in filter box)
4. **Reload page:** Cmd+R
5. Look for **`tfhe_bg.wasm`** entry

**What you should see:**
- File: `tfhe_bg.wasm`
- Status: **200** (not 404, not 304)
- Type: **wasm**
- Size: ~1.0 MB
- Content-Type header: **application/wasm**

### Step 2: Try Quick Fixes (2 min)

If Network tab shows tfhe_bg.wasm with 200 OK:
- **Hard refresh:** Cmd+Shift+R
- **Retry encryption**

If Network tab shows 404 OR tfhe_bg.wasm missing:
- **Restart dev server:**
  ```bash
  # Press Ctrl+C in terminal running dev server
  cd /Users/imransayed/Veilscore/veilscore-fhevm/apps/web
  pnpm dev
  ```
- **Hard refresh browser:** Cmd+Shift+R
- **Retry encryption**

### Step 3: Run Diagnostics (2 min)

Open DevTools Console and paste:

```javascript
(async () => {
  const tfhe = await import('@zama-fhe/tfhe-js');
  console.log('✓ Package loaded');
  console.log('Shortint available:', !!tfhe.Shortint);
  console.log('initSDK available:', !!tfhe.initSDK);
  
  if (tfhe.initSDK && typeof tfhe.initSDK === 'function') {
    console.log('Calling initSDK...');
    await tfhe.initSDK();
    console.log('✓ initSDK completed');
    console.log('Shortint after init:', !!tfhe.Shortint);
  }
})().catch(e => console.error('Error:', e.message));
```

**Expected output:**
```
✓ Package loaded
Shortint available: true
initSDK available: true
Calling initSDK...
✓ initSDK completed
Shortint after init: true
```

---

## 📋 If That Didn't Work

### Symptom: Network tab shows 404 for tfhe_bg.wasm
**Fix:** Package not installed or wrong path
```bash
cd /Users/imransayed/Veilscore/veilscore-fhevm/apps/web
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

### Symptom: Network tab shows 200 but Content-Type is text/html
**Fix:** WASM served with wrong MIME type
```bash
# Restart dev server (Ctrl+C then run again)
pnpm dev
```

### Symptom: Console shows "Cannot find module"
**Fix:** Package not fully installed
```bash
cd /Users/imransayed/Veilscore/veilscore-fhevm/apps/web
pnpm install @zama-fhe/tfhe-js@^0.1.2
pnpm dev
```

### Symptom: tfhe_bg.wasm not in Network tab at all
**Fix:** Vite not bundling it correctly
```bash
# Check if file exists
ls -lh node_modules/@zama-fhe/tfhe-js/dist/browser/tfhe-rs/browser/tfhe_bg.wasm

# Should show a file > 1MB
# If missing, run: pnpm install
# Then restart: pnpm dev
```

---

## 📚 Full Diagnostics

If quick fixes don't work, see: **`FIX_WASM_UNDEFINED_ERROR.md`**

This has:
- Complete decision tree
- Advanced debugging options
- WASM load path verification
- Vite configuration updates

---

## ✅ Verification

After fix, run this in console:

```javascript
console.log('Testing TFHE...');
import('@zama-fhe/tfhe-js').then(async (tfhe) => {
  console.log('✓ TFHE imported');
  
  if (typeof tfhe.initSDK === 'function') {
    await tfhe.initSDK();
    console.log('✓ WASM initialized');
  }
  
  console.log('Shortint:', tfhe.Shortint ? '✓' : '✗');
  console.log('Test:', tfhe.Shortint ? '✅ READY' : '❌ FAILED');
}).catch(e => console.error('❌ Error:', e.message));
```

---

## 📞 If Stuck

Share this info:
1. Network tab screenshot (showing tfhe_bg.wasm row)
2. Console output (including errors)
3. Output of: `ls -lh node_modules/@zama-fhe/tfhe-js/dist/browser/tfhe-rs/browser/tfhe_bg.wasm`

---

## Summary

| Problem | Fix |
|---------|-----|
| 404 for .wasm | Reinstall: `pnpm install` |
| Wrong Content-Type | Restart: `pnpm dev` |
| Not appearing | Restart server + hard refresh |
| "Cannot find module" | Install: `pnpm install @zama-fhe/tfhe-js` |
| Still broken | See `FIX_WASM_UNDEFINED_ERROR.md` |

**Start with:** Check Network tab, then restart dev server, then hard refresh browser.
