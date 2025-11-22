# WASM Loading Diagnostics - Browser Console Script

Copy and paste the entire code block below into your browser console (DevTools) and run it. This will show you exactly what's happening with WASM loading.

```javascript
// ========== TFHE WASM Diagnostics Script ==========
console.log('🔍 Starting TFHE WASM Diagnostics...\n');

(async () => {
  try {
    console.log('=== ENVIRONMENT CHECK ===');
    console.log('window:', typeof window);
    console.log('globalThis:', typeof globalThis);
    console.log('self:', typeof self);
    
    console.log('\n=== STEP 1: Import @zama-fhe/tfhe-js ===');
    const tfhePackage = await import('@zama-fhe/tfhe-js');
    console.log('✓ Package imported');
    console.log('Exports:', Object.keys(tfhePackage).filter(k => !k.startsWith('_')).slice(0, 20));
    
    console.log('\n=== STEP 2: Check Key Exports ===');
    const { TFHERs, Shortint, initSDK } = tfhePackage;
    console.log('TFHERs:', !!TFHERs ? '✓' : '✗');
    console.log('Shortint:', !!Shortint ? '✓' : '✗');
    console.log('initSDK:', !!initSDK ? '✓' : '✗');
    console.log('initSDK typeof:', typeof initSDK);
    
    console.log('\n=== STEP 3: Call initSDK ===');
    if (typeof initSDK === 'function') {
      console.log('Calling initSDK()...');
      const result = await initSDK();
      console.log('✓ initSDK() completed');
      console.log('Result:', result);
    } else {
      console.log('initSDK is not a function, type:', typeof initSDK);
    }
    
    console.log('\n=== STEP 4: Check Shortint After Init ===');
    console.log('Shortint now:', !!Shortint ? '✓' : '✗');
    
    if (Shortint) {
      console.log('\n=== STEP 5: Check Shortint Methods ===');
      const methods = [
        'bc_get_shortint_parameters',
        'gen_client_key',
        'create_server_key',
        'serialize_client_key',
      ];
      for (const method of methods) {
        console.log(`  Shortint.${method}:`, Shortint[method] ? '✓' : '✗');
      }
    }
    
    console.log('\n=== STEP 6: Network Check ===');
    console.log('Check DevTools → Network tab:');
    console.log('1. Look for .wasm files (filter for "wasm")');
    console.log('2. Should see tfhe_bg.wasm');
    console.log('3. Status should be 200');
    console.log('4. Content-Type should be "application/wasm"');
    
    console.log('\n✅ DIAGNOSTICS COMPLETE');
    console.log('\nSummary:');
    console.log('- Package imported:', '✓');
    console.log('- initSDK callable:', typeof initSDK === 'function' ? '✓' : '✗');
    console.log('- Shortint available:', !!Shortint ? '✓' : '✗');
    
  } catch (err) {
    console.error('\n❌ ERROR:', err);
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    
    if (err.message.includes('Cannot read properties of undefined')) {
      console.error('\n🔧 FIX: WASM module not initialized');
      console.error('Action: Check Network tab for tfhe_bg.wasm (should be 200 OK)');
    }
  }
})();
```

## How to Use

1. **Open DevTools:** Option+Cmd+I (Mac) or F12
2. **Go to Console tab**
3. **Copy the entire code block above** (from `console.log('🔍'...` to `})();`)
4. **Paste into console**
5. **Press Enter**

## What to Check

### If you see ✓ for everything:
- WASM is loading correctly
- You can proceed to test encryption
- The initialization issue is resolved

### If you see ✗ for Shortint:
- WASM module didn't initialize
- Go to Network tab and filter for .wasm
- Look for tfhe_bg.wasm
- Check if Status is 200
- Check if Content-Type is application/wasm

### If you see an error:
- Copy the error message
- Check what it says about the problem
- Share it for further debugging

## Network Tab Checks

**To check if WASM file is loading:**

1. Open DevTools → Network tab
2. Filter for "wasm" (in the filter box)
3. Reload the page (Cmd+R)
4. Look for `tfhe_bg.wasm`
5. Click on it and check:
   - **Status:** Should be 200 (not 404, not 304)
   - **Type:** Should be "wasm"
   - **Size:** Should be ~1.0 MB
   - **Response Headers:** Content-Type should be application/wasm
   - **Request URL:** Should show the correct path from @zama-fhe package

**If tfhe_bg.wasm is missing (404):**
- The file isn't being served
- Check Vite is running
- Check file exists: `node_modules/@zama-fhe/tfhe-js/dist/browser/tfhe-rs/browser/tfhe_bg.wasm`
- May need: `pnpm install` or restart dev server

**If Content-Type is wrong:**
- Vite may be serving it incorrectly
- Try: Restart Vite dev server
- Or: Update vite.config.ts MIME type handling

## Expected Output

When everything works, you'll see:
```
=== ENVIRONMENT CHECK ===
window: object
globalThis: object
self: object

=== STEP 1: Import @zama-fhe/tfhe-js ===
✓ Package imported
Exports: [list of exports]

=== STEP 2: Check Key Exports ===
TFHERs: ✓
Shortint: ✓
initSDK: ✓
initSDK typeof: function

=== STEP 3: Call initSDK ===
Calling initSDK()...
✓ initSDK() completed
Result: undefined

=== STEP 4: Check Shortint After Init ===
Shortint now: ✓

=== STEP 5: Check Shortint Methods ===
  Shortint.bc_get_shortint_parameters: ✓
  Shortint.gen_client_key: ✓
  Shortint.create_server_key: ✓
  Shortint.serialize_client_key: ✓

✅ DIAGNOSTICS COMPLETE
```

## Troubleshooting

### "Cannot read properties of undefined (reading 'bc_get_shortint_parameters')"
- WASM didn't initialize
- Check Network tab for tfhe_bg.wasm
- Verify Status is 200
- Check Content-Type header

### "initSDK is not a function"
- Package structure issue
- Try: `window.location.reload()` (full refresh)
- Or: Cmd+Shift+R (hard refresh)

### File not found in Network tab
- WASM not being served
- Restart dev server: Kill and run `pnpm dev` again
- Or: Run `pnpm install` if package is missing

## Next Steps

After running this diagnostic:
1. **If ✓ everywhere:** Run `initializeTfheWasm()` from your app
2. **If errors:** Share the console output
3. **If Network issues:** Check Vite is running and working
