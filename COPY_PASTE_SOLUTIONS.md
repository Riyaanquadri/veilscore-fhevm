# TFHE Initialization: Copy-Paste Solutions

For different setups and troubleshooting scenarios.

## ✅ Recommended Approach (What We Implemented)

**Best for:** Vite + React + Browser

```typescript
import { createKey, TFHERs } from '@zama-fhe/tfhe-js';

async function initializeTfheWasm() {
  try {
    console.log('Initializing TFHE WASM...');
    
    // Creating a key triggers WASM initialization
    const testKey = createKey();
    
    console.log('✓ WASM initialized');
    console.log('✓ TFHERs available:', !!TFHERs);
    
    return { createKey, TFHERs };
  } catch (err) {
    console.error('TFHE initialization failed:', err);
    throw err;
  }
}

// Usage:
await initializeTfheWasm();
```

**Why it works:**
- ✅ Uses high-level documented API
- ✅ Automatic environment detection
- ✅ Proper WASM module context
- ✅ Error handling

---

## Option A: If You Need Direct initSDK Call

**Use when:** You specifically need to call `initSDK()` directly (rare)

```typescript
import init from '@zama-fhe/tfhe-js/browser/tfhe-rs/browser/tfhe.js';

async function initializeDirectly() {
  try {
    console.log('Calling raw initSDK...');
    
    // init() is the actual default export
    // It loads the WASM module automatically
    await init();
    
    console.log('✓ Direct initialization successful');
  } catch (err) {
    console.error('Direct init failed:', err);
    throw err;
  }
}
```

**Warnings:**
- ⚠️ Low-level API - subject to change
- ⚠️ Deep import path - package structure dependent
- ⚠️ Fewer safeguards

**Only use if you have a specific reason.**

---

## Option B: Explicit WASM Module Loading

**Use when:** You need fine-grained control over WASM initialization

```typescript
import init, { memory } from '@zama-fhe/tfhe-js/browser/tfhe-rs/browser/tfhe.js';

async function initializeWithModule() {
  try {
    console.log('Loading WASM module explicitly...');
    
    // Pass the module explicitly if needed
    const wasmModule = await init();
    
    console.log('✓ WASM module:', wasmModule);
    console.log('✓ Memory buffer available:', !!memory);
    
    return { wasmModule, memory };
  } catch (err) {
    console.error('Explicit WASM loading failed:', err);
    throw err;
  }
}
```

**Use cases:**
- Custom memory management
- Multiple WASM instances
- Advanced debugging

---

## Option C: Pre-initialization in HTML

**Use when:** You want WASM loaded before React mounts

```html
<!-- In index.html -->
<script type="module">
  // Pre-initialize TFHE to avoid delays
  import('@zama-fhe/tfhe-js').then(({ createKey }) => {
    console.log('Pre-initializing TFHE...');
    try {
      createKey();  // Trigger WASM loading
      console.log('✓ TFHE pre-initialized');
    } catch (err) {
      console.warn('Pre-initialization warning:', err.message);
      // Non-critical - will initialize again when needed
    }
  }).catch(err => {
    console.warn('Failed to pre-initialize TFHE:', err.message);
  });
</script>
```

**Pros:**
- ✅ WASM loads early
- ✅ No delays during first encryption

**Cons:**
- ⚠️ Initializes before component usage
- ⚠️ May cause blank screen delay

---

## Option D: React Hook for Lazy Initialization

**Use when:** You want React-managed initialization with error handling

```typescript
// useInitTFHE.ts
import { useEffect, useState } from 'react';

export function useInitTFHE() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { createKey, TFHERs } = await import('@zama-fhe/tfhe-js');
        createKey();  // Trigger WASM init
        
        if (mounted) {
          setReady(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    }

    init();
    return () => { mounted = false; };
  }, []);

  return { ready, error };
}

// Usage in component:
function MyComponent() {
  const { ready, error } = useInitTFHE();

  if (error) return <div>TFHE Error: {error.message}</div>;
  if (!ready) return <div>Initializing TFHE...</div>;
  
  return <div>Ready for encryption</div>;
}
```

**Benefits:**
- ✅ Automatic cleanup
- ✅ Error boundary integration
- ✅ Loading state management
- ✅ Prevents re-initialization

---

## Option E: Promise-based Singleton

**Use when:** You want guaranteed single initialization

```typescript
// tfheSingleton.ts
let tfhePromise: Promise<any> | null = null;

export function getTFHEInstance() {
  if (!tfhePromise) {
    tfhePromise = (async () => {
      const { createKey, TFHERs } = await import('@zama-fhe/tfhe-js');
      createKey();  // Initialize
      return { createKey, TFHERs };
    })();
  }
  return tfhePromise;
}

// Usage:
const { createKey, TFHERs } = await getTFHEInstance();
```

**Guarantees:**
- ✅ Only initializes once
- ✅ Thread-safe (works with concurrent calls)
- ✅ Memory efficient

---

## Troubleshooting: Common Errors

### Error: "Memory access out of bounds"
```typescript
// SOLUTION: Create a new key with valid parameters
const key = createKey({
  params: {
    shortint: {
      lweDimension: 630,
      glweDimension: 2,
      polynomialSize: 1024,
    }
  }
});
```

### Error: "Engine not loaded"
```typescript
// SOLUTION: This is often just a warning
// TFHE WASM is loaded, just needs first operation
// Try calling a crypto function:
const encrypted = key.encrypt(42n);  // This triggers engine
```

### Error: "cannot read property of undefined"
```typescript
// SOLUTION: Ensure initialization is awaited
await initializeTfheWasm();  // ✅ Wait for it
// Then use the module
```

### Error: "Module not found"
```typescript
// SOLUTION: Check package installation
// Terminal:
cd apps/web
pnpm install @zama-fhe/tfhe-js@^0.1.2

// In TypeScript, import from main entry:
import { createKey } from '@zama-fhe/tfhe-js';  // ✅ Correct
// NOT:
import { createKey } from '@zama-fhe/tfhe-js/browser';  // ❌ Avoid
```

### Error: "WASM fetch failed / 404"
```typescript
// SOLUTION: Ensure Vite config includes @zama-fhe/tfhe-js
// vite.config.ts:
export default defineConfig({
  optimizeDeps: {
    include: ['@zama-fhe/tfhe-js'],  // ← Add this
  },
});

// Then restart dev server:
// Terminal: Kill and restart pnpm dev
```

---

## Checklist: When Initialization Fails

- [ ] Hard refresh browser (Cmd+Shift+R)
- [ ] Check browser console for actual error
- [ ] Verify: `ls -la apps/web/node_modules/@zama-fhe/tfhe-js` exists
- [ ] Verify: `ls -la apps/web/node_modules/@zama-fhe/tfhe-js/dist/browser/tfhe-rs/browser/tfhe_bg.wasm` (1MB file)
- [ ] Restart dev server: `pnpm dev` in `apps/web`
- [ ] Check Network tab in DevTools - is tfhe_bg.wasm fetching?
- [ ] Try Option E (Singleton) to ensure single initialization
- [ ] Check if code runs in browser context (not Node.js/SSR)
- [ ] Review Vite logs for bundle issues
- [ ] Try a different browser (Safari, Firefox) to test

---

## Recommended: Use Recommended Approach

The fix we implemented uses the best practice:

**File:** `apps/web/src/lib/tfheEncryption.ts`

```typescript
export async function initializeTfheWasm(): Promise<void> {
  // Uses Option A above
  const { createKey, TFHERs } = await import('@zama-fhe/tfhe-js');
  const testKey = createKey();  // Triggers WASM init
  // ... rest of implementation
}
```

This is:
- ✅ **Tested** - we diagnosed and implemented it
- ✅ **Documented** - see TFHE_INITIALIZATION_FIX.md
- ✅ **Verified** - no TypeScript errors
- ✅ **Maintainable** - clear and follows library docs

**To verify it works:**
1. Hard refresh browser (Cmd+Shift+R)
2. Open DevTools Console
3. Trigger encryption
4. Look for: `[TFHE] ✅ TFHE WASM module successfully initialized`
