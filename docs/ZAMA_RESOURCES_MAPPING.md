# Zama Resources to Code Mapping

Maps the critical Zama resources to the specific VeilScore code files that need them.

---

## 1. Relayer SDK → `lib/relayerClient.ts`

**Resource:** https://github.com/zama-ai/relayer-sdk

**What to extract:**
- Relayer endpoint URL (built-in network config)
- POST `/evaluate` endpoint shape
- Request format (commitment, inputProof, etc.)
- Response format (allowed, commitment, etc.)
- Error handling patterns

**Code file needs:**
```typescript
// lib/relayerClient.ts
export async function evaluateWithRelayer(
  encryptedInputs: Uint8Array,
  publicInputs: object
) {
  // Need exact POST body structure from relayer-sdk
  // Need error handling from relayer docs
}
```

**Action:**
1. Review `relayer-sdk/src/api/` for endpoint definitions
2. Look for TypeScript interface definitions
3. Copy request/response shapes to comments in relayerClient.ts
4. Test with mock relayer endpoint

---

## 2. TFHE Core (tfhe-rs) + JS Tutorial → `lib/encryption.ts`

**Resource:** 
- https://github.com/zama-ai/tfhe-rs
- https://docs.zama.org/guides/js-tfhe

**What to extract:**
- WASM initialization code
- `clientKey.encrypt(value, type)` API
- `secretKey.decrypt(ciphertext)` API
- Supported FHE types (uint8, uint16, uint32, uint64, etc.)
- Key generation and storage patterns

**Code file needs:**
```typescript
// lib/encryption.ts
export async function initializeWasm() {
  // Initialize TFHE WASM from tfhe-rs
}

export async function encryptSignals(
  followers: number,
  txCount: number,
  publicKey: Uint8Array
) {
  // Encrypt each value using tfhe-rs APIs
}

export async function decryptSignals(
  encryptedFollowers: Uint8Array,
  secretKey: Uint8Array
) {
  // Decrypt locally using tfhe-rs secretKey
}
```

**Action:**
1. Review tfhe-rs WASM examples in `tfhe-rs/bindings/wasm/`
2. Follow JS tutorial step-by-step
3. Test WASM initialization in browser console
4. Document key types and ranges

---

## 3. @zama-fhe/tfhe-js (Optional) → `lib/encryption.ts`

**Resource:** https://cdn.jsdelivr.net/npm/@zama-fhe/tfhe-js

**When to use:**
- If raw tfhe-rs WASM is too low-level
- For convenience wrappers around encrypt/decrypt
- For simpler browser integration

**Code file consideration:**
```typescript
// Option 1: Use @zama-fhe/tfhe-js (convenience)
import { Tfhe } from '@zama-fhe/tfhe-js';

// Option 2: Use tfhe-rs directly (more control)
import * as Tfhe from 'tfhe-wasm';
```

**Action:**
1. Compare both approaches
2. Choose based on project needs (likely tfhe-js for ease)
3. Install: `npm install @zama-fhe/tfhe-js`
4. Update encryption.ts accordingly

---

## 4. Relayer Docs (Official) → `apps/web/src/lib/useFhevm.ts`

**Resource:** https://docs.zama.org/guides/relayer-sdk

**What to extract:**
- Full API reference for relayer submit/evaluate
- Network configurations (Sepolia, devnet, etc.)
- Configuration object shape
- Authentication patterns (if any)

**Code file needs:**
```typescript
// apps/web/src/lib/useFhevm.ts
const RELAYER_CONFIG = {
  // From Relayer Docs: https://docs.zama.org/...
  endpoint: 'https://...',
  networkId: 'sepolia',
  // Other config from docs
};
```

**Action:**
1. Read through official relayer docs
2. Extract complete API signatures
3. Document in comments with link back to docs
4. Test with example payloads

---

## 5. FHEVM React Template → `apps/web/src/components/InputForm.tsx`

**Resource:** https://github.com/zama-ai/fhevm-react-template

**What to extract:**
- React component patterns for FHE
- State management for encrypted values
- Error handling patterns
- User feedback (loading, success, error states)
- Integration with ethers.js or viem

**Code patterns:**
```typescript
// From template:
const [status, setStatus] = useState('idle');
const [encryptedValue, setEncryptedValue] = useState(null);

// onCompute pattern
const onCompute = async () => {
  setStatus('encrypting');
  // Encrypt
  
  setStatus('submitting');
  // Submit to contract
  
  setStatus('complete');
};
```

**Action:**
1. Clone template repo locally
2. Review InputForm equivalent component
3. Copy patterns to VeilScore InputForm.tsx
4. Adapt for VeilScore-specific flows

---

## 6. Solidity FHE Operations → `contracts/VeilScore.sol`

**Resource:** https://github.com/zama-ai/fhevm/blob/main/lib/TFHE.sol

**What to extract:**
- FHE comparison operators (gt, lt, eq, etc.)
- Supported FHE types in Solidity
- FHE compute patterns
- Result unsealing patterns

**Code needs:**
```solidity
// contracts/VeilScore.sol
import "fhevm/lib/TFHE.sol";

// FHE operations on encrypted score
TFHE.gt(encryptedScore, MIN_SCORE)  // Compare encrypted values
TFHE.add(x, y)  // Add encrypted values
```

**Action:**
1. Review TFHE.sol library
2. Document which operations are used in VeilScore
3. Comment with links to upstream docs
4. Test FHE operations on local devnet

---

## Resource Priority by Phase

### Phase 1: Local Development (Week 1)
1. ✅ Relayer SDK — understand API contract
2. ✅ TFHE JS Tutorial — get WASM working
3. ✅ FHEVM React Template — copy patterns
4. ⏳ Zama Discord — ask questions

### Phase 2: Contract Integration (Week 2)
1. ✅ TFHE.sol in fhevm repo
2. ✅ Solidity FHE examples
3. ✅ ACL contracts (Sepolia)

### Phase 3: Production (Week 3)
1. ✅ Relayer Docs (official)
2. ✅ Network configs (from SDK)
3. ✅ Security best practices

---

## Quick Navigation

| I need... | Go to... | File it affects |
|-----------|----------|-----------------|
| Relayer endpoint | Relayer SDK repo | `lib/relayerClient.ts` |
| Encryption API | tfhe-rs + JS tutorial | `lib/encryption.ts` |
| Contract ABI | FHEVM repo | `lib/contractClient.ts` |
| React patterns | FHEVM React template | `InputForm.tsx` |
| Solidity ops | TFHE.sol in fhevm | `VeilScore.sol` |
| Network config | Relayer SDK built-in | `.env` |
| Error handling | Relayer Docs + Discord | All files |

---

## How to Use This Mapping

1. **Before coding a component:** Find it in this table
2. **Open the resource link** in a separate browser tab
3. **Extract the specific API/pattern**
4. **Document it in comments** with link back to resource
5. **Add to .env or config** if it's a parameter
6. **Test locally** before pushing to GitHub

**Example workflow:**
```
Task: Update lib/relayerClient.ts
  1. Go to: https://github.com/zama-ai/relayer-sdk
  2. Find: POST /evaluate endpoint
  3. Extract: Request/response shape
  4. Add: to relayerClient.ts with comment
  5. Test: with worker/relayerStub.js
  6. Commit: with resource link in commit message
```

---

## .env Resources

Add these to `.env` for easy reference:

```env
# ZAMA RESOURCES (See docs/ZAMA_RESOURCES_MAPPING.md)
ZAMA_RELAYER_SDK=https://github.com/zama-ai/relayer-sdk
ZAMA_TFHE_RS=https://github.com/zama-ai/tfhe-rs
ZAMA_TFHE_JS=https://www.npmjs.com/package/@zama-fhe/tfhe-js
ZAMA_FHEVM_TEMPLATE=https://github.com/zama-ai/fhevm-react-template
ZAMA_DOCS=https://docs.zama.org
ZAMA_DISCORD=https://discord.gg/ZkE4GkSKsq
```

Then reference with:
```bash
source .env
open $ZAMA_RELAYER_SDK
```

---

## Resource Health Check

As you integrate, verify these are still accurate:

- [ ] Relayer SDK repo is public and has latest code
- [ ] TFHE.js package is on npm with recent updates
- [ ] FHEVM React template works without errors
- [ ] Official Zama docs are accessible
- [ ] Discord community is active
- [ ] Sepolia network configs match .env

**Last verified:** November 22, 2025
**Next check:** Before production deployment
