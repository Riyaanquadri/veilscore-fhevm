# Debug Console - What to Check

## The Enhanced Debug Page

I've updated the `DebugTfhe.tsx` component to display detailed diagnostic logs directly on the page (not just in console).

## How to Use

1. Click the blue **"Open Debug"** button in the top-right corner
2. You'll see the debug console with a detailed step-by-step breakdown
3. Each step shows:
   - ✅ Success (green)
   - ❌ Error (red)
   - ℹ️ Info (blue)

## What the Debug Console Checks

### Step 1: WASM File Accessibility
```
Step 1: Checking WASM file accessibility...
✓ WASM file found (Status: 200)
  Content-Type: application/wasm
```

**What to look for:**
- Status should be `200` (not 404)
- Content-Type should be `application/wasm` (not text/html)
- If failed: WASM not at `/tfhe_bg.wasm` or not being served with correct headers

### Step 2: Import TFHE Package
```
Step 2: Importing @zama-fhe/tfhe-js...
✓ Package imported. Exports: 42
  Keys: init, initSDK, TfheClientKey, TfheConfigBuilder, ...
```

**What to look for:**
- Should see many exports (usually 30+)
- `initSDK` should be listed
- If failed: Package not installed or corrupted

### Step 3: Check initSDK Function
```
Step 3: Checking initSDK function...
✓ initSDK function found
```

**What to look for:**
- Should show "initSDK function found"
- If failed: TFHE package may be corrupted

### Step 4: Initialize WASM
```
Step 4: Calling initSDK({ wasmUrl: '/tfhe_bg.wasm' })...
✓ initSDK completed successfully
```

**What to look for:**
- Should show "initSDK completed successfully"
- If failed: Check CSP allows `unsafe-eval`, check WASM file headers

### Step 5: Check Exports After Init
```
Step 5: Checking exports after initialization...
✓ Exports after init: 42
  Keys: init, initSDK, TfheClientKey, TfheConfigBuilder, ...
```

**What to look for:**
- Export count should stay the same or increase
- If fewer: WASM failed to initialize properly

### Step 6: Verify Key Classes
```
Step 6: Verifying key classes...
✓ TfheClientKey available
✓ TfheConfigBuilder available
✓ TfheCompactPublicKey available
✅ TFHE WASM initialization SUCCESSFUL!
```

**What to look for:**
- All three should show ✓
- Final status should be green (✅ TFHE Ready)
- If any missing: WASM did not initialize correctly

## Status Indicators

### ✅ Success
```
Status: ✅ TFHE Ready - All key classes available
```
- TFHE is fully initialized
- Ready to perform encryption
- You can go back and use normal app features

### ⚠️ Warning (CSP Issue)
```
Status: ❌ InitSDK failed
```
Likely causes:
1. CSP blocks `unsafe-eval` - Check DevTools Issues tab
2. WASM file not loading - Check Network tab for `/tfhe_bg.wasm`
3. WASM MIME type wrong - Network tab should show `application/wasm`

### ❌ Error (Other Issues)
```
Status: ❌ Fatal error: [error message]
```
Check:
1. Browser console (F12) for detailed error
2. Network tab for failed requests
3. CSP directives in DevTools Issues

## Browser DevTools Integration

**Also check DevTools Console (F12) for:**
1. Any CSP violation messages
2. TFHE initialization logs from tfheEncryption.ts
3. Network tab → filter by `tfhe_bg.wasm`

**Look for in Network tab:**
- Status: 200 (success)
- Content-Type: `application/wasm`
- Size: ~1.0 MB

## Common Issues & Fixes

| Issue | Status Shows | Fix |
|-------|--------------|-----|
| WASM not found | "✗ WASM returned status 404" | Run `node apps/web/scripts/copy-wasm.js` |
| Wrong MIME type | "✗ WASM returned status 200" but Content-Type is text/html | Restart dev server, check vite.config.ts middleware |
| CSP blocks eval | Logs show success but "InitSDK failed" | Hard refresh, check CSP allows `unsafe-eval` |
| Package corrupted | "✗ initSDK not found" | Run `cd apps/web && pnpm install` |
| WASM init failed | No error message shown | Check browser console for WASM loading errors |

## Next Steps

### If Status is ✅ TFHE Ready
1. Close the debug panel
2. Go back to main app
3. Try to fetch signals and compute VeilScore
4. Should work without "Shortint not found" errors

### If Status is ❌ Error
1. Note the specific error message
2. Check the fix in the table above
3. Make the suggested change
4. Hard refresh the page
5. Check debug logs again

## Debug Console Features

- **Color-coded logs**: Green (success), Red (error), Blue (info)
- **Timestamps**: Each log shows when it occurred
- **Scrollable**: If many logs, you can scroll through them
- **Real-time**: Updates as each step completes

## Tips for Debugging

1. **Don't just look at final status** - read through all steps to see where it failed
2. **Check DevTools alongside** - Console and Network tabs show deeper details
3. **Hard refresh often** - CSP and WASM changes need a full refresh
4. **Check one thing at a time** - Fix WASM file, then CSP, then TFHE package

---

**Ready?** Click the blue "Open Debug" button and share the logs if you see errors!
