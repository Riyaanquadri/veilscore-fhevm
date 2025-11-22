# Verification Guide: SDK Initialization Fixes

## Step-by-Step Verification

### Step 1: Clear Cache & Reinstall

```bash
# From project root
pnpm install

# Specifically verify web packages
cd apps/web
pnpm list @zama-fhe/tfhe-js
# Should show: @zama-fhe/tfhe-js@0.1.2

cd ../..
```

### Step 2: Start Development Stack

**Terminal 1**: Hardhat Node
```bash
npx hardhat node
```

**Terminal 2**: Backend Server
```bash
pnpm server:dev
# Wait for: Server listening on port 4000
```

**Terminal 3**: Frontend (with detailed logging)
```bash
cd apps/web
pnpm dev
# Look for: ready in XXX ms
```

### Step 3: Open Browser & Check Console

1. Navigate to: **http://localhost:5173**
2. Open DevTools: **F12** (Windows/Linux) or **Cmd+Option+I** (Mac)
3. Go to **Console** tab
4. Look for these success messages:

```
[TFHE] Loading TFHE WASM module...
[TFHE] Importing @zama-fhe/tfhe-js/browser...
[TFHE] Package loaded, checking exports...
[TFHE] Available exports: [list of 20+ exports]
[TFHE] Calling initSDK() with configuration...
[TFHE] ✓ WASM runtime initialized via initSDK()
[TFHE] ✓ TFHERs object available for cryptographic operations
[TFHE] ✅ TFHE WASM module successfully initialized
```

### Step 4: Verify Form Works

1. Enter a Twitter handle (e.g., "vitalikbuterin")
2. Enter a wallet address (e.g., "0x1234...")
3. Click "Compute VeilScore"
4. Look for encryption logs:

```
[Zama] Encrypting signals with TFHE...
[FHECompute] Starting encrypted score computation...
[FHECompute] Threshold evaluation (encrypted)...
[FHECompute] Computation complete (encrypted evaluation)...
```

### Step 5: Check Transaction

1. Hardhat node should show transaction logs
2. Form should show success message
3. No red errors in browser console (warnings are OK)

---

## Expected Output Timeline

### On Page Load (0-2 seconds)
```
✓ Page renders
✓ TFHE WASM loads
✓ TFHE initializes with initSDK()
✓ Form is interactive
```

### On Form Submission (2-5 seconds)
```
✓ Signals encrypted
✓ FHE computation runs
✓ Transaction submitted
✓ Success message shown
```

---

## Troubleshooting Matrix

| Symptom | Cause | Solution |
|---------|-------|----------|
| Blank page, no logs | Module load failed | Check network tab for 404s |
| `initSDK is not a function` | Wrong export name | Already fixed, run `pnpm install` |
| `Cannot find module '@zama-fhe/tfhe-js'` | Package not installed | `cd apps/web && pnpm install` |
| `[TFHE] ✓` but form slow | Initialization works, network issue | Check backend server |
| Form submits but no transaction | Contract address wrong | Update `VITE_VEILSCORE_ADDRESS` |
| WASM 404 in network tab | File not served | Hard refresh, clear cache |

---

## Critical Logs to Look For

### ✅ ALL GOOD Signs

```
[TFHE] ✅ TFHE WASM module successfully initialized
[relayerInit] Relayer SDK initialization complete
[Zama] Encrypting signals with TFHE...
[FHECompute] ✓ Computation complete
```

### ⚠️ WARNING (Non-Critical)

```
[TFHE] ⚠️ TFHERs not accessible
[relayerInit] ⚠️ SDK.SepoliaConfig not found
```

### ❌ ERRORS (Must Fix)

```
[TFHE] Failed to initialize WASM module
[relayerInit] Failed to initialize Relayer SDK
Failed to encrypt signals
Cannot find VeilScore contract
```

---

## Package Version Verification

Run in browser console:

```javascript
// Check package info
import('@zama-fhe/tfhe-js/browser').then(pkg => {
  const keys = Object.keys(pkg);
  console.table({
    'Package': '@zama-fhe/tfhe-js/browser',
    'Has initSDK': typeof pkg.initSDK,
    'Has TFHERs': typeof pkg.TFHERs,
    'Export count': keys.length,
    'First 5 exports': keys.slice(0, 5).join(', ')
  });
});
```

Expected output:
- Has initSDK: ✓ function
- Has TFHERs: ✓ object
- Export count: 15+

---

## Code Changes Reference

### File: `apps/web/src/lib/tfheEncryption.ts`

**Line ~140-150**: FIXED
```typescript
const initSDK = tfhePackage.initSDK;  // ✓ Correct export name
if (typeof initSDK !== 'function') {
  throw new Error('initSDK function not found...');
}

console.log('[TFHE] Calling initSDK() with configuration...');
await initSDK({});  // ✓ Pass required config object
```

### File: `apps/web/src/lib/relayerInit.ts`

**Line ~30-60**: IMPROVED
```typescript
// Added pattern detection for multiple SDK versions
if (typeof window.relayerSDK.initSDK === 'function') {
  await window.relayerSDK.initSDK(initOptions);
} else if (typeof window.relayerSDK.init === 'function') {
  await window.relayerSDK.init(initOptions);
} else {
  // Continue with auto-init
}
```

### File: `apps/web/src/lib/fheCompute.ts`

**Line ~14**: FIXED
```typescript
// ❌ Removed problematic import
// import { TFHERs } from '@zama-fhe/tfhe-js/browser';

// ✓ Comment explaining why
// TFHERs is only available after initializeTfheWasm() is called
```

---

## Quick Diagnostic Script

Paste into browser console to auto-check everything:

```javascript
async function diagnoseTFHE() {
  console.log('=== TFHE Diagnostics ===');
  
  try {
    // 1. Check package
    const pkg = await import('@zama-fhe/tfhe-js/browser');
    console.log('✓ Package loads');
    
    // 2. Check initSDK
    if (typeof pkg.initSDK !== 'function') {
      throw new Error('initSDK not a function');
    }
    console.log('✓ initSDK found');
    
    // 3. Initialize
    await pkg.initSDK({});
    console.log('✓ initSDK() succeeded');
    
    // 4. Check TFHERs
    if (!pkg.TFHERs) {
      console.warn('⚠️ TFHERs not available (may be OK)');
    } else {
      console.log('✓ TFHERs available');
    }
    
    console.log('✅ All diagnostics passed!');
  } catch (err) {
    console.error('❌ Diagnostic failed:', err.message);
    console.error('Stack:', err.stack);
  }
}

// Run it
diagnoseTFHE();
```

---

## Deployment Verification

When deploying to Sepolia:

1. Same code works (no changes needed for Sepolia vs localhost)
2. Update `.env`:
```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/...
DEPLOYER_PRIVATE_KEY=0x...
```

3. Deploy:
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

4. Update deployed contract address in `.env`:
```bash
VITE_VEILSCORE_ADDRESS=0x<deployed_address>
```

5. Frontend will work with same SDK initialization (no code changes)

---

## Next Steps if Issues Persist

1. **Read**: `docs/SDK_INITIALIZATION_TROUBLESHOOTING.md` (comprehensive guide)
2. **Check**: Browser Network tab for `.wasm` file 404s or CORS errors
3. **Verify**: `pnpm list` shows correct @zama-fhe/tfhe-js version
4. **Test**: Run diagnostic script above in console
5. **Ask**: Include console output when seeking help

---

## Success Criteria ✅

Your implementation is working correctly when:

- [ ] No red errors in browser console on page load
- [ ] See `[TFHE] ✅ TFHE WASM module successfully initialized`
- [ ] Form can be filled without errors
- [ ] Clicking "Compute VeilScore" submits transaction
- [ ] Hardhat node shows transaction receipt
- [ ] No WASM 404s in Network tab

---

## Resources

- **TFHE-rs docs**: https://docs.zama.org/guides/js-tfhe
- **Troubleshooting**: `docs/SDK_INITIALIZATION_TROUBLESHOOTING.md`
- **Fixes Summary**: `docs/SDK_FIXES_SUMMARY.md`
- **FHE Details**: `docs/FHE_COMPUTATION_IMPLEMENTATION.md`

---

Generated: November 22, 2025
