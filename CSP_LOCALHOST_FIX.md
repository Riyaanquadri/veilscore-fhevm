# CSP & Localhost Connection - Fixed

## The Issue
```
connect-src 'self' https: wss:
Content Security Policy blocked http://localhost:4000
```

The CSP policy we created for TFHE was too restrictive - it only allowed `https:` and `wss:` connections, but the local development backend runs on `http://localhost:4000`.

## Root Cause
The CSP directives were:
- ❌ `connect-src 'self' https: wss:` - blocks http://localhost
- ❌ `style-src` not defined - falls back to `default-src 'self'` which blocks inline styles

## What Was Fixed

### 1. **index.html** - Updated Meta CSP
```html
<!-- BEFORE -->
content="... connect-src 'self' https:; object-src 'none';"

<!-- AFTER -->
content="... connect-src 'self' http://localhost:* https: wss:; style-src 'self' 'unsafe-inline'; object-src 'none';"
```

**Changes:**
- ✅ `connect-src 'self' http://localhost:* https: wss:` - allows localhost on any port
- ✅ `style-src 'self' 'unsafe-inline'` - allows inline styles (needed for React components)

### 2. **vite.config.ts** - Updated Server CSP Headers
Same CSP policy updated in server headers for consistency.

## What This Allows

| Type | Pattern | Purpose |
|------|---------|---------|
| Script Eval | `'unsafe-eval'` | TFHE WASM glue `new Function()` |
| Inline Scripts | `'unsafe-inline'` | React inline event handlers |
| Inline Styles | `'unsafe-inline'` (style-src) | React inline style props |
| Local Backend | `http://localhost:*` | Fetch from backend on any port |
| HTTPS | `https:` | Production APIs |
| WebSockets | `wss:` | Future WebSocket connections |

## What Still Works (Blocked)

| Type | Why Blocked |
|------|------------|
| External APIs | Not in CSP (only localhost + https) |
| Unsafe Scripts | Not in `script-src` |
| Eval on page | Still requires `unsafe-eval` |

## Now Do This

1. **Hard refresh**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. **Try fetching signals** again
3. **Check console** for success logs like:
   ```
   [signals] Fetching from: http://localhost:4000/api/signals?address=...
   [signals] Response status: 200
   [signals] Fetched data: { followers: ..., txCount: ..., sources: [...] }
   ```

## Expected Behavior

### Before ❌
```
Connecting to 'http://localhost:4000/api/signals?...' violates the following 
Content Security Policy directive: "connect-src 'self' https:"
Failed to fetch
```

### After ✅
```
[signals] Fetching from: http://localhost:4000/api/signals?address=...
[signals] Response status: 200
[signals] Fetched data: { followers: 123456, txCount: 789, sources: [...] }
Signals populated successfully
```

## Files Changed

- ✅ `apps/web/index.html` - Meta CSP policy
- ✅ `apps/web/vite.config.ts` - Server header CSP policy

## ⚠️ Important Notes

### Dev Only
This CSP is **development only** with `unsafe-eval` and `unsafe-inline`. Do NOT deploy to production.

### Production CSP
Before going to production, you should:
1. Remove `'unsafe-eval'` and `'unsafe-inline'`
2. Use exact HTTPS URLs instead of `https:`
3. Use nonce-based or hash-based inline styles (if any)
4. Remove `http://localhost:*`
5. Consider using strict CSP headers

Example production CSP:
```
default-src 'none';
script-src 'self' https://trusted-cdn.example.com;
style-src 'self' https://trusted-cdn.example.com;
connect-src 'self' https://api.example.com https://rpc.ethereum.org;
object-src 'none';
```

---

**Next step:** Hard refresh and try fetching signals again!
