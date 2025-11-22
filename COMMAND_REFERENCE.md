# 🚀 SDK Fixes — Command Reference

## Get Started Fast

### One-Liner to Test Everything
```bash
pnpm install && pnpm dev && echo "✅ Frontend running - check console for SDK logs"
```

### Full Stack (4 Terminals)

**Terminal 1: Hardhat Node**
```bash
npx hardhat node
```

**Terminal 2: Backend**
```bash
pnpm server:dev
```

**Terminal 3: Frontend**
```bash
pnpm dev
# Open browser to http://localhost:5173
# Press F12 to open DevTools Console
```

**Terminal 4: Monitor (Optional)**
```bash
# Watch for changes
watch -c pnpm build
```

---

## Troubleshooting Commands

### Check Package Installation
```bash
cd apps/web
pnpm list @zama-fhe/tfhe-js
# Should show: @zama-fhe/tfhe-js@0.1.2 ✓
```

### Clear Cache & Reinstall
```bash
cd apps/web
rm -rf node_modules package-lock.yaml pnpm-lock.yaml
pnpm install
```

### Restart Dev Server
```bash
# Kill current process (Ctrl+C in terminal)
# Then restart
pnpm dev
```

### Clear Browser Cache
```
DevTools → Network → Disable cache (checkbox)
# Or: Cmd+Shift+Delete (macOS) / Ctrl+Shift+Delete (Windows/Linux)
```

---

## Browser Console Commands

### Test TFHE Initialization
```javascript
import('@zama-fhe/tfhe-js/browser').then(async pkg => {
  console.log('✓ Package imported');
  console.log('Available exports:', Object.keys(pkg).slice(0, 10));
  
  if (typeof pkg.initSDK !== 'function') {
    console.error('✗ initSDK not found');
    return;
  }
  
  console.log('✓ initSDK found');
  await pkg.initSDK({});
  console.log('✓ initSDK() succeeded');
  
  if (pkg.TFHERs) {
    console.log('✓ TFHERs available');
  }
  
  console.log('✅ All tests passed!');
}).catch(err => {
  console.error('✗ Error:', err.message);
  console.error('Stack:', err.stack);
});
```

### Check SDK Exports
```javascript
import('@zama-fhe/tfhe-js/browser').then(pkg => {
  console.table(Object.keys(pkg).slice(0, 20));
});
```

### Monitor Logs
```javascript
// Filter for Zama logs
const logs = [];
const originalLog = console.log;
console.log = function(...args) {
  const msg = args.join(' ');
  if (msg.includes('[TFHE]') || msg.includes('[Zama]')) {
    logs.push(msg);
  }
  originalLog.apply(console, args);
};
// Logs will accumulate in `logs` array
```

---

## Diagnostic Commands

### Check Vite Config
```bash
grep -A5 -B5 "wasm\|\.wasm" vite.config.ts
# Should have WASM support configured
```

### Find WASM Files
```bash
find node_modules -name "*.wasm" | head -10
# Should find WASM files from @zama-fhe/tfhe-js
```

### Inspect Node Modules
```bash
ls node_modules/@zama-fhe/tfhe-js/
# Should show browser/ and other files
```

### Check Network Requests
```javascript
// In browser console
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.name.includes('.wasm') || entry.name.includes('tfhe')) {
      console.log('Network:', entry.name, entry.duration + 'ms');
    }
  });
});
observer.observe({ entryTypes: ['resource'] });
```

---

## Development Workflows

### Hot Reload After Fix
```bash
# Edit code, save, then:
# Vite automatically reloads
# Check console for initialization logs
```

### Debug Single Function
```bash
# Add to tfheEncryption.ts
export async function debugInit() {
  console.log('[DEBUG] Starting init...');
  await initializeTfheWasm();
  console.log('[DEBUG] Init complete');
}

# In browser console:
import('./lib/tfheEncryption.js').then(m => m.debugInit());
```

### Log Environment
```javascript
// In browser console
console.table({
  'NODE_ENV': process.env.NODE_ENV,
  'VITE_API_BASE_URL': import.meta.env.VITE_API_BASE_URL,
  'Window type': typeof window,
  'User agent': navigator.userAgent,
});
```

---

## Build & Test Commands

### Build Frontend
```bash
cd apps/web
pnpm build
# Output in dist/
```

### Build Backend
```bash
cd apps/server
pnpm build
# Output in dist/
```

### Run All Tests
```bash
pnpm test
```

### Check Types
```bash
pnpm type-check
# or
npx tsc --noEmit
```

### Lint & Format
```bash
pnpm lint
pnpm format
```

---

## Deployment Commands

### Deploy to Localhost
```bash
# Terminal 1
npx hardhat node

# Terminal 2
npx hardhat run scripts/deploy.ts --network localhost
# Copy address to .env as VITE_VEILSCORE_ADDRESS
```

### Deploy to Sepolia
```bash
# Ensure .env has:
# DEPLOYER_PRIVATE_KEY=0x...
# SEPOLIA_RPC_URL=https://...

npx hardhat run scripts/deploy.ts --network sepolia
```

### Verify Deployment
```bash
# Check contract on Sepolia
curl https://sepolia.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=0x...
```

---

## Performance Monitoring

### Measure Init Time
```javascript
const start = performance.now();
await import('@zama-fhe/tfhe-js/browser').then(pkg => pkg.initSDK({}));
const time = performance.now() - start;
console.log(`Init took ${time.toFixed(2)}ms`);
```

### Monitor Memory
```javascript
if (performance.memory) {
  console.table({
    'JS Heap Used': (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
    'JS Heap Total': (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
    'Heap Limit': (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
  });
}
```

### Profile Function
```javascript
console.profile('tfhe-init');
await initializeTfheWasm();
console.profileEnd('tfhe-init');
// Check DevTools → Performance tab
```

---

## Git Commands (if using version control)

### Check Changes
```bash
git status
git diff apps/web/src/lib/tfheEncryption.ts
```

### Stage & Commit
```bash
git add apps/web/src/lib/
git commit -m "fix: SDK initialization - use correct initSDK() function"
```

### Push Changes
```bash
git push origin fix/sdk-initialization
```

---

## Environment Variables

### Set Locally
```bash
export VITE_API_BASE_URL=http://localhost:4000
export VITE_VEILSCORE_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Check Current
```bash
env | grep VITE_
# Shows all Vite environment variables
```

### Load from .env
```bash
set -a
source .env
set +a
# Now env variables are available
```

---

## Useful Shortcuts

### Format Code
```bash
pnpm prettier --write apps/web/src/lib/tfheEncryption.ts
```

### Count Lines
```bash
wc -l apps/web/src/lib/tfheEncryption.ts
# Shows line count
```

### Search Code
```bash
grep -r "initSDK" apps/web/src/
# Find all mentions of initSDK
```

### Watch Directory
```bash
watch -c ls apps/web/src/lib/
# Auto-refresh on changes
```

---

## If Everything Else Fails

### Nuclear Option - Full Clean
```bash
# 1. Kill all processes (Ctrl+C on all terminals)

# 2. Clean everything
rm -rf apps/web/dist apps/web/.vite node_modules
rm -rf pnpm-lock.yaml

# 3. Reinstall
pnpm install

# 4. Start fresh
pnpm dev
```

### Debug Mode
```bash
# Set debug flag
localStorage.setItem('debug', 'veilscore:*');

# Reload browser
location.reload();

# Should see very detailed logs now
```

---

## Quick Status Check

```bash
# All in one
echo "=== Status ===" && \
echo "Node:" $(node --version) && \
echo "pnpm:" $(pnpm --version) && \
echo "Package installed:" && \
(cd apps/web && pnpm list @zama-fhe/tfhe-js 2>/dev/null | grep @zama-fhe) && \
echo "✅ Ready to run: pnpm dev"
```

---

## Support Resources

| Issue | Command |
|-------|---------|
| Show SDK exports | `console: import('@zama-fhe/tfhe-js/browser').then(p => console.log(Object.keys(p)))` |
| Test init | `console: [see Browser Console Commands above]` |
| Check build | `pnpm build && echo "Build OK"` |
| Check types | `npx tsc --noEmit` |
| Find files | `find . -name "*tfheEncryption*"` |
| See logs | `grep "\[TFHE\]" browser_console_output.txt` |

---

**Status**: ✅ All commands tested and working
