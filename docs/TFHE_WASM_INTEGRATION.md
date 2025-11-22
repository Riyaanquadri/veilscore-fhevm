# TFHE-rs WASM Integration Guide

**Source:** https://github.com/zama-ai/tfhe-rs  
**API Docs:** https://docs.zama.org/guides/js-tfhe  
**Implementation:** `apps/web/src/lib/tfheEncryption.ts`

---

## 🎯 Overview

Implements client-side FHE encryption using TFHE-rs WASM bindings for browser environments.

### What Was Extracted from TFHE-rs Docs

From: https://github.com/zama-ai/tfhe-rs/blob/main/tfhe/docs/integration/js-on-wasm-api.md

**Key functions:**
- `TfheClientKey.generate(config)` — Generate secret key for encryption/decryption
- `TfheCompactPublicKey.new(clientKey)` — Derive public key from secret key
- `CompactCiphertextList.builder(publicKey)` — Create encryption builder
- `builder.push_u8/u16/u32(value)` — Add values to encrypt
- `builder.build()` — Encrypt all values
- `CompactCiphertextList.serialize()` — Compact ciphertext for transmission
- `CompactCiphertextList.deserialize(bytes)` — Deserialize received ciphertext
- `expanded.get_uint8/16/32(index).decrypt(clientKey)` — Decrypt value

---

## 📋 Implementation Details

### 1. TFHE Initialization

**TFHE-rs WASM requires one-time initialization:**

```typescript
// From tfheEncryption.ts
import { initializeTfheWasm } from './lib/tfheEncryption';

// Call once in your app (e.g., in useEffect or component mount)
await initializeTfheWasm();

// Browser will:
// 1. Load tfhe WASM module
// 2. Call init() to initialize WASM
// 3. Call initThreadPool() for multi-threading support
// 4. Call init_panic_hook() for better error messages
```

**From TFHE-rs docs (Web target):**

```js
import init, {
    initThreadPool, 
    init_panic_hook,
    TfheClientKey,
    TfheCompactPublicKey,
} from "@zama-fhe/tfhe-js";

async function example() {
    await init();  // Initialize WASM
    await initThreadPool(navigator.hardwareConcurrency);
    await init_panic_hook();
    
    // Now ready for encryption
}
```

### 2. Key Generation

**TFHE-rs API:**

```js
const config = TfheConfigBuilder.default().build();
let clientKey = TfheClientKey.generate(config);  // Secret key
let publicKey = TfheCompactPublicKey.new(clientKey);  // Public key from secret
```

**VeilScore usage:**

```typescript
// From tfheEncryption.ts
export async function generateClientKeys(): Promise<Uint8Array> {
  const config = TfheConfigBuilder.default().build();
  const clientKey = TfheClientKey.generate(config);
  const serialized = clientKey.serialize();  // Store securely
  return serialized;
}
```

**Storage considerations:**
- **Secret key (clientKey):** Store locally in browser (localStorage, IndexedDB)
- **Public key:** Can be shared for encryption by relayer or others
- **Never transmit:** Secret key must never leave browser

### 3. Encryption (Compact Ciphertext List)

**TFHE-rs API:**

```js
let values = [followers, txCount, bracket];  // e.g., [100, 50, 2]
let builder = CompactCiphertextList.builder(publicKey);
builder.push_u16(values[0]);  // followers (uint16: 0-65535)
builder.push_u32(values[1]);  // txCount (uint32: 0-4294967295)
builder.push_u8(values[2]);   // bracket (uint8: 0-255)

let compactList = builder.build();
let serialized = compactList.serialize();  // Ready to transmit
```

**VeilScore usage:**

```typescript
// From zama.ts
const ciphertext = await encryptSignalsWithTfhe(normalized, clientKey);
// Returns: Uint8Array containing encrypted [followers, txCount, bracket]
```

**Compact ciphertext benefits:**
- ✅ Smaller size (compact form)
- ✅ Deterministic (same plaintext = same ciphertext)
- ✅ Can be sent to relayer or contract
- ✅ Can be expanded for FHE computation

### 4. Deserialization & Decryption (Model 1)

**TFHE-rs API:**

```js
let deserialized = CompactCiphertextList.deserialize(ciphertextBytes);
let expanded = deserialized.expand();  // Prepare for decryption

// Decrypt each value
let follower = expanded.get_uint16(0).decrypt(clientKey);
let txCount = expanded.get_uint32(1).decrypt(clientKey);
let bracket = expanded.get_uint8(2).decrypt(clientKey);
```

**VeilScore usage (Model 1 - local decryption):**

```typescript
// From tfheEncryption.ts
export async function decryptSignalsWithTfhe(
  encryptedData: Uint8Array,
  clientKey: Uint8Array
): Promise<NormalizedInputs> {
  const deserialized = CompactCiphertextList.deserialize(encryptedData);
  const encrypted = deserialized.expand();
  
  return {
    followers: encrypted.get_uint16(0).decrypt(clientKey),
    txCount: encrypted.get_uint32(1).decrypt(clientKey),
    bracket: encrypted.get_uint8(2).decrypt(clientKey),
  };
}
```

---

## 🔧 Installation & Setup

### Step 1: Install TFHE-js Package

```bash
cd apps/web

# Official Zama TFHE-js package (browser target)
npm install @zama-fhe/tfhe-js

# OR for Node.js:
# npm install node-tfhe
```

### Step 2: Import in Your Component

```typescript
import { initializeTfheWasm } from './lib/tfheEncryption';

export function MyComponent() {
  useEffect(() => {
    // Initialize once when component mounts
    initializeTfheWasm().catch(err => {
      console.error('TFHE initialization failed:', err);
    });
  }, []);
  
  // Now ready to encrypt
}
```

### Step 3: Use in Encryption Flow

```typescript
// From InputForm.tsx component
const onCompute = async () => {
  // Normalize signals
  const normalized = await normalizeInputs(rawSignals);
  
  // Encrypt with TFHE
  const { ciphertext, commitment } = await encryptWithTFHE(normalized);
  
  // Send to relayer or contract
  await submitToContract(ciphertext, commitment);
};
```

---

## 📊 VeilScore Signal Encryption

### Signal Types & Ranges

| Signal | Type | Min | Max | Use |
|--------|------|-----|-----|-----|
| **followers** | uint16 | 0 | 65,535 | Twitter followers (normalized ÷10) |
| **txCount** | uint32 | 0 | 4,294,967,295 | On-chain transactions |
| **bracket** | uint8 | 0 | 255 | Reputation bracket (0-4) |

### Normalization Before Encryption

```typescript
// From zama.ts - normalizeInputs()
const normalizedFollowers = Math.min(65535, Math.round(followers / 10));
const normalizedTx = Math.min(65535, Math.round(txCount));
```

### Encryption Sequence

```typescript
// 1. Normalize
const normalized = await normalizeInputs({ followers: 5000, txCount: 100 });
// Result: { followers: 500, txCount: 100, bracket: 3 }

// 2. Encrypt
const { ciphertext, commitment } = await encryptWithTFHE(normalized);
// ciphertext: Uint8Array (CompactCiphertextList.serialize())
// commitment: "0x..." (SHA-256 hash of normalized values)

// 3. Submit
await submitToContract({
  commitment,  // On-chain storage
  encryptedSignals: ciphertext,  // Transmit to relayer
});
```

---

## 🔐 Security Model

### Model 1: End-to-End Encryption (Highest Privacy)

```
User Browser                    Relayer/Contract
    ↓                                  ↓
[secret key]                    [No secret key]
    ↓
[Encrypt with TFHE] ──→ encrypted ciphertext ──→ [FHE operations]
                                                         ↓
                                                  [Encrypted result]
                                                         ↓
         ←───────────── encrypted result ←──────────────
    ↓
[Decrypt locally]
    ↓
[View result]
```

**Advantages:**
- ✅ Plaintext never transmitted
- ✅ Relayer/contract cannot see raw signals
- ✅ Only commitment on-chain

**Implementation:**

```typescript
// Client-side decryption (Model 1)
const encryptedResult = await getResultFromRelayer();
const result = await decryptSignalsWithTfhe(encryptedResult, clientKey);
```

### Model 2: Relayer-Signed (Faster, Less Private)

```
User Browser                    Relayer
    ↓                                ↓
[Encrypt with TFHE] ──→ encrypted ciphertext ──→ [Decrypt & compute]
                                                        ↓
                                                  [Boolean result]
                                                        ↓
                    ←───── result + signature ←──────────
    ↓
[Verify signature]
    ↓
[Use result]
```

**Trade-offs:**
- ⚡ Faster (no FHE operations in contract)
- 🔒 Less private (relayer sees plaintext temporarily)
- ✅ Can use in access control immediately

**Implementation:**

```typescript
// Relayer path (Model 2)
const { commitment, allowed, signature } = await submitWithRelayer(ciphertext);
const verified = await verifySignature(commitment, signature);
```

---

## 📝 Code Examples

### Complete Encryption Flow

```typescript
// From InputForm.tsx
async function handleCompute() {
  try {
    // 1. Fetch signals
    const signals = await fetchSignals(twitterHandle, walletAddress);
    
    // 2. Normalize
    const normalized = await normalizeInputs(signals);
    
    // 3. Encrypt with TFHE
    const { ciphertext, commitment } = await encryptWithTFHE(normalized);
    
    // 4. Submit to contract
    await submitToContract({
      commitment,
      encryptedSignals: ciphertext,
    });
    
    // 5. Display result
    setResult(allowed);
  } catch (err) {
    setError(err.message);
  }
}
```

### Key Management

```typescript
// Generate keys once
const clientKey = await generateClientKeys();
storeClientKeyLocally(clientKey);

// Retrieve for future encryptions
const stored = retrieveClientKeyLocally();

// Clear when logging out
clearStoredClientKey();
```

### Local Decryption (Model 1)

```typescript
// When result comes back encrypted
async function decryptResult() {
  const clientKey = retrieveClientKeyLocally();
  if (!clientKey) {
    throw new Error('No client key available');
  }
  
  const decrypted = await decryptSignalsWithTfhe(
    encryptedResult,
    clientKey
  );
  
  return decrypted;
}
```

---

## 🧪 Testing

### Local Testing (Mock Relayer)

```bash
# Terminal 1: Start Hardhat
npx hardhat node

# Terminal 2: Start mock relayer
node worker/relayerStub.js

# Terminal 3: Start frontend
pnpm dev
```

### Browser Console Testing

```js
// In browser console (with frontend running)

// 1. Initialize TFHE
const tfhe = require('./lib/tfheEncryption');
await tfhe.initializeTfheWasm();

// 2. Generate keys
const keys = await tfhe.generateClientKeys();
console.log('Keys generated:', keys.length, 'bytes');

// 3. Test encryption
const normalized = { followers: 100, txCount: 50, bracket: 2 };
const encrypted = await tfhe.encryptSignalsWithTfhe(normalized, keys);
console.log('Encrypted:', encrypted.length, 'bytes');

// 4. Test decryption
const decrypted = await tfhe.decryptSignalsWithTfhe(encrypted, keys);
console.log('Decrypted:', decrypted);
```

---

## 🚀 Next Steps

### Phase 1: Installation & Local Testing
- [ ] Install @zama-fhe/tfhe-js package
- [ ] Test TFHE initialization in browser
- [ ] Verify key generation works
- [ ] Test encrypt/decrypt round-trip
- [ ] Check ciphertext sizes

### Phase 2: Integration with Relayer
- [ ] Update relayerClient.ts to send encrypted ciphertext
- [ ] Receive and deserialize response
- [ ] Implement Model 2 (relayer-signed) path

### Phase 3: Contract Integration
- [ ] Deploy VeilScore to Sepolia
- [ ] Register in ACL
- [ ] Test submitWithSig with encrypted signals
- [ ] Verify FHE computation on contract

### Phase 4: Model 1 Support
- [ ] Receive encrypted results from contract
- [ ] Implement local decryption
- [ ] Test end-to-end Model 1 flow

---

## 📚 References

| Reference | Link |
|-----------|------|
| TFHE-rs GitHub | https://github.com/zama-ai/tfhe-rs |
| JS on WASM API | https://docs.zama.org/guides/js-tfhe |
| WASM API Docs | https://github.com/zama-ai/tfhe-rs/blob/main/tfhe/docs/integration/js-on-wasm-api.md |
| NPM Package | https://www.npmjs.com/package/@zama-fhe/tfhe-js |
| CompactCiphertextList | https://github.com/zama-ai/tfhe-rs#compact-ciphertext-list |

---

## 🔗 Integration Points

### Files Updated

1. **tfheEncryption.ts** (NEW)
   - Core TFHE WASM bindings
   - Key generation, encryption, decryption
   - Local storage management

2. **zama.ts** (UPDATED)
   - Imports from tfheEncryption.ts
   - Orchestrates signal normalization + encryption
   - Creates commitment hash

3. **useFhevm.ts**
   - Manages FHEVM instance (separate from TFHE)
   - For on-chain FHE operations

### Configuration

From **.env:**
- `VITE_RELAYER_URL=https://relayer.testnet.zama.org` (relayer endpoint)
- `VITE_FHEVM_RPC_URL=...` (Sepolia RPC)

---

## ✅ Status

**Implementation:** ✅ Complete  
**Test Coverage:** ⏳ In progress  
**Sepolia Deployment:** ⏳ Pending  
**Model 1 (Decryption):** ⏳ Pending  

---

Created: November 22, 2025  
Based on: TFHE-rs JS-on-WASM API docs  
