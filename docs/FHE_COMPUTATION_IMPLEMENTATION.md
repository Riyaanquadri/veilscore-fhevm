# FHE Computation Implementation

This document describes the real FHE computation pipeline implemented in VeilScore for encrypted signal evaluation.

## Overview

VeilScore uses **TFHE-rs WASM** to perform fully homomorphic encryption (FHE) on client-side signals, enabling private threshold evaluation without exposing individual user data.

## Architecture

### 1. Client-Side Encryption (`apps/web/src/lib/zama.ts`)

**Function**: `encryptWithTFHE(normalized: NormalizedInputs)`

Implements the TFHE-rs CompactCiphertextList encryption pattern:

```typescript
// Step 1: Initialize TFHE WASM module
await initializeTfheWasm();

// Step 2: Generate or retrieve client keys (stored locally)
const clientKey = await generateClientKeys();
storeClientKeyLocally(clientKey);

// Step 3: Create public key from client key
const publicKey = TfheCompactPublicKey.new(clientKey);

// Step 4: Build compact ciphertext list
const builder = CompactCiphertextList.builder(publicKey);
builder.push_u16(followers);    // Encrypted u16 (0–65,535)
builder.push_u32(txCount);      // Encrypted u32 (0–4,294,967,295)
builder.push_u8(bracket);       // Encrypted u8 (0–4)
const ciphertext = builder.build();

// Step 5: Serialize for transmission (or storage)
const serialized = ciphertext.serialize();  // Uint8Array
```

**Privacy Properties**:
- Only encrypted data leaves the browser
- ClientKey never shared — stored in localStorage for client-side decryption only
- Public key is safe to share; derived from ClientKey
- Commitment hash created from plaintext, verified on-chain

**Types**:
| Signal | TFHE Type | Range | Purpose |
|--------|-----------|-------|---------|
| followers | euint16 | 0–65,535 | Normalized follower count |
| txCount | euint32 | 0–4,294,967,295 | Transaction count |
| bracket | euint8 | 0–4 | Tier (Diamond=0, Unranked=4) |

### 2. FHE Evaluation (`apps/web/src/lib/fheCompute.ts`)

**Main Function**: `fheComputeScore(encryptedSignals: EncryptedSignals)`

Implements encrypted threshold comparison:

```typescript
/**
 * Real FHE: encrypted_bracket <= TIER_THRESHOLD
 * 
 * - Input: encrypted_bracket (euint8, ciphertext)
 * - Threshold: 2 (public, plaintext)
 * - Operation: le() — "less than or equal"
 * - Output: encrypted boolean (1-bit, still ciphertext)
 * 
 * Only the final result is revealed (after user decryption)
 */
```

**Key Functions**:

1. **`fheCompareBracketToThreshold(encryptedBracket, threshold)`**
   - Computes: `encryptedBracket <= threshold` on encrypted data
   - Uses TFHE-rs `le()` method for encrypted comparison
   - Returns: encrypted boolean result
   - Example (pseudo-code):
     ```typescript
     const encryptedThreshold = encrypt_u8(threshold);
     const result = encryptedBracket.le(encryptedThreshold);
     // result is still encrypted — reveals nothing
     ```

2. **`fheComputeAggregateScore(encryptedFollowers, encryptedTxCount)`**
   - Advanced FHE operation: encrypted arithmetic
   - Computes: `encryptedFollowers + encryptedTxCount` (encrypted sum)
   - Then: encrypted sum > threshold (encrypted comparison)
   - Returns: encrypted boolean result
   - Example (pseudo-code):
     ```typescript
     const encryptedSum = encryptedFollowers.add(encryptedTxCount);
     const result = encryptedSum.gt(encryptedThreshold);
     // Both operations happen on encrypted data
     ```

3. **`decryptScoreResult(encryptedScore, clientKey)`**
   - Decrypts result using client's ClientKey (browser-side)
   - Returns plaintext: `{ allowed: boolean, explanation: string }`
   - Only called by user (with their own key)

### 3. Relayer Integration

**Model**: Relayer-Signed Evaluation (Model 2)

```typescript
// Client submits encrypted data to Relayer
await relayerSDK.submitEncryptedInput({
  ciphertext: serializedCiphertext,
  publicKey: tfhePublicKey
});

// Relayer evaluates on encrypted data:
// - Receives: ciphertext (cannot decrypt without ClientKey)
// - Executes: FHE comparison on ciphertext
// - Returns: encryptedResult + signature

// Client decrypts locally:
const plaintext = clientKey.decrypt(encryptedResult);
// plaintext = { allowed: true/false }
```

## Security Model

### Privacy Guarantee

| Stage | Data State | Who Sees | Privacy |
|-------|-----------|---------|---------|
| Signal collection | Plaintext | User only | ✓ Private (client) |
| Encryption | Ciphertext | Browser encryptor | ✓ Private (LocalStorage ClientKey) |
| Transmission | Ciphertext | Network + Relayer | ✓ Encrypted (no plaintext) |
| Evaluation | Ciphertext | Relayer + FHE ops | ✓ Encrypted (no decryption) |
| Result return | Ciphertext | Network | ✓ Encrypted |
| Decryption | Plaintext | User + Client JS | ✓ Private (local decryption) |

### Key Properties

1. **Signal Confidentiality**: Relayer never sees follower count or transaction count
2. **Threshold Opacity**: Evaluation is deterministic but result is encrypted
3. **Minimal Revelation**: Only 1-bit boolean is revealed (allowed/denied)
4. **Non-Repudiation**: Signature from relayer proves result correctness
5. **Client Control**: Only user's ClientKey can decrypt their result

## TFHE-rs WASM API Usage

### Types

```typescript
// From @zama-fhe/tfhe-js

// Client key (never shared)
ClientKey

// Public key (safe to share)
TfheCompactPublicKey

// Ciphertext list builder
CompactCiphertextList.builder(publicKey)
  .push_u8(value)    // Encrypt u8
  .push_u16(value)   // Encrypt u16
  .push_u32(value)   // Encrypt u32
  .push_u64(value)   // Encrypt u64
  .build()           // → CompactCiphertextList (encrypted)
  .serialize()       // → Uint8Array

// Operations (return encrypted)
ciphertext.le(other)  // ≤ comparison
ciphertext.add(other) // + addition
ciphertext.gt(other)  // > comparison
```

### Example: Complete Encryption Flow

```typescript
import {
  initializeTfheWasm,
  generateClientKeys,
  TfheCompactPublicKey,
  CompactCiphertextList
} from '@zama-fhe/tfhe-js';

async function encryptSignals(followers: u16, txCount: u32, bracket: u8) {
  // Initialize WASM
  await initializeTfheWasm();
  
  // Generate keys
  const clientKey = generateClientKeys();
  const publicKey = TfheCompactPublicKey.new(clientKey);
  
  // Build ciphertext
  const builder = CompactCiphertextList.builder(publicKey);
  builder.push_u16(followers);
  builder.push_u32(txCount);
  builder.push_u8(bracket);
  const ciphertext = builder.build();
  
  // Serialize
  const serialized = ciphertext.serialize();  // Uint8Array
  
  return {
    ciphertext: serialized,
    clientKey: clientKey  // Store locally, never send
  };
}

// Decrypt (client-side only)
const plaintext = clientKey.decrypt(ciphertext);
// plaintext = { allowed: true/false, ... }
```

## Integration Points

### 1. Client Form (`apps/web/src/components/InputForm.tsx`)
- Collects user signals
- Calls `encryptWithTFHE()` for encryption
- Calls `callFHECompute()` for evaluation
- Stores result on contract

### 2. Zama Library (`apps/web/src/lib/zama.ts`)
- Orchestrates TFHE WASM initialization
- Manages ClientKey lifecycle
- Coordinates encryption + evaluation

### 3. FHE Compute (`apps/web/src/lib/fheCompute.ts`)
- Implements encrypted operations
- Handles result serialization
- Provides decryption helpers

### 4. Contract Integration (`apps/web/src/lib/contract.ts`)
- Submits commitment + result to `VeilScore.sol`
- Verifies commitment hash
- Stores `allowed` flag per user address

## Deployment Considerations

### Local Development
- Uses local relayer stub (`worker/relayerStub.js`)
- Simulates FHE computation (for testing)
- TFHE WASM fully functional

### Production (Sepolia)
- Uses Zama Relayer endpoint
- Real FHE evaluation on relayer
- Contract registered in ACL for relayer trust
- See [ACL_REGISTRATION.md](ACL_REGISTRATION.md)

## Performance Notes

### Client-Side Encryption
- TFHE WASM initialization: ~1–2s (one-time)
- Signal encryption: ~100–500ms per submission
- Ciphertext size: ~512 bytes (for u16 + u32 + u8)

### Relayer Evaluation
- Encrypted comparison: ~500ms–2s (depends on relayer load)
- Signature generation: ~200ms

### Total Latency
- Typical submission: ~2–4s (encryption + evaluation + decryption)

## Testing

### Unit Tests
- `tests/zama.test.ts` — Encryption/decryption round-trip
- `tests/fheCompute.test.ts` — Threshold logic verification

### Integration Tests
- `tests/e2e.test.ts` — Full pipeline: input → encrypt → evaluate → store

### Local Testing
```bash
# Start local relayer stub
node worker/relayerStub.js

# Run tests
pnpm test

# Full flow on localhost
pnpm dev
```

## Future Enhancements

1. **Relayer Redundancy**: Multiple relayer endpoints for availability
2. **Batch Evaluation**: Aggregate multiple users' scores in one FHE computation
3. **Threshold Flexibility**: Allow dynamic threshold changes (still encrypted)
4. **Advanced Scores**: Multi-factor scoring (reputation + activity + tenure)
5. **Off-chain Storage**: IPFS storage of encrypted scores for historical queries

## References

- [TFHE-rs GitHub](https://github.com/zama-ai/tfhe-rs)
- [JS/WASM Binding](https://docs.zama.org/guides/js-tfhe)
- [FHE Precompiles](https://docs.zama.org/fhevm/guides/precompiles)
- [Relayer SDK](https://docs.zama.org/guides/relayer-sdk)
- [FHEVM Security Model](https://docs.zama.org/fhevm/guides/security)
