# Integration Guide: Relayer + InputForm

This guide explains how to integrate the relayer architecture (privacy models, signature verification) with the existing InputForm component.

## Current State

- ✅ VeilScore contract supports `submit()` and `submitWithSig()`
- ✅ Local relayer stub ready for testing
- ✅ FHEVM SDK config and hooks in place
- ⏳ InputForm needs to call `submitWithSig()` with relayer signatures

## Architecture Overview

```
User Browser
    │
    ├─ InputForm.tsx
    │  - Collects Twitter + wallet
    │  - Fetches live signals via backend
    │  - Normalizes to tier
    │
    ├─ encryptWithTFHE(normalized)  [zama.ts]
    │  - Encrypts tier + commitment
    │  - Returns (ciphertext, commitment)
    │
    ├─ callFHECompute(ciphertext)  [zama.ts + relayer]
    │  - Sends to relayer
    │  - Relayer evaluates inside FHEVM
    │  - Returns signed result
    │
    └─ submitToContract(signature)  [contract.ts]
       - Calls submitWithSig(commitment, allowed, signature)
       - Contract verifies relayer signature
       - Entry stored on-chain
```

## Step-by-Step Integration

### 1. Use Real FHEVM Instance in InputForm

**Current:**
```typescript
// InputForm.tsx - currently mocking
const encryptedData = await encryptWithTFHE(normalized);
const result = await callFHECompute(encryptedData);
```

**Update to:**
```typescript
import { useFhevm } from "../lib/useFhevm";

export function InputForm() {
  const { instance, status } = useFhevm();  // ← Add this
  
  // Check instance is ready
  if (status !== "ready") {
    return <div>Loading FHEVM instance...</div>;
  }
  
  // Use real instance for encryption
  const encrypted = await instance.encrypt64(tier);  // Real encryption!
}
```

### 2. Call Relayer to Evaluate

**Current (mock):**
```typescript
// zama.ts - mocking relayer response
export async function callFHECompute(ciphertext) {
  // Simulated evaluation
  const allowed = bracket <= 2;
  return { commitment, allowed, mockSignature };
}
```

**Update to:**
```typescript
// zama.ts - real relayer call
export async function callFHECompute(
  ciphertext: FheUint64,
  userAddress: string
) {
  // Get relayer instance
  const relayer = await getRelayerSDK();
  
  // Call relayer.evaluate() to compute inside FHEVM
  const response = await fetch(
    `${process.env.VITE_SEPOLIA_RELAYER_URL}/api/evaluate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        encryptedInput: ciphertext,  // encrypted tier
        userAddress: userAddress,
        inputProof: {},  // from FHEVM SDK
      }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Relayer evaluation failed: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  return {
    commitment: result.commitment,  // hash of encrypted input
    allowed: result.allowed,        // plaintext boolean (Model 2)
    signature: result.signature,    // relayer's signature
  };
}
```

### 3. Submit Signed Result to Contract

**Current (simple):**
```typescript
// contract.ts - uses submit() (no signature)
export async function submitToContract(commitment, allowed) {
  const tx = await contract.submit(commitment, allowed);
  return tx.wait();
}
```

**Update to:**
```typescript
// contract.ts - uses submitWithSig() with relayer signature
export async function submitToContract(
  commitment: string,
  allowed: boolean,
  relayerSignature: string,
  signer: ethers.Signer
) {
  // Get contract instance
  const contract = new ethers.Contract(
    process.env.VITE_VEILSCORE_ADDRESS!,
    VeilScoreABI,
    signer
  );
  
  // Call submitWithSig with relayer-signed data
  const tx = await contract.submitWithSig(
    commitment,
    allowed,
    relayerSignature
  );
  
  const receipt = await tx.wait();
  
  if (!receipt || receipt.status !== 1) {
    throw new Error("Contract submission failed");
  }
  
  return receipt;
}
```

### 4. Update InputForm to Wire It Together

**Key changes:**
```typescript
import { useFhevm } from "../lib/useFhevm";
import { normalizeInputs, encryptWithTFHE, callFHECompute } from "../lib/zama";
import { submitToContract } from "../lib/contract";

export function InputForm() {
  const { instance, status } = useFhevm();
  const { data: signer } = useAccount();  // Get wallet signer
  
  async function onCompute() {
    // 1. Fetch + normalize signals
    const signals = await fetchAndHydrateSignals(twitterHandle, walletAddress);
    
    // 2. Encrypt with FHEVM
    const encrypted = await instance.encrypt64(signals.bracket);
    
    // 3. Evaluate with relayer
    const evaluated = await callFHECompute(
      encrypted,
      walletAddress
    );
    
    // 4. Submit to contract with signature
    const receipt = await submitToContract(
      evaluated.commitment,
      evaluated.allowed,
      evaluated.signature,
      signer
    );
    
    console.log("✅ Submitted on-chain:", receipt.transactionHash);
  }
  
  return (
    <>
      {/* UI */}
      <button onClick={onCompute} disabled={status !== "ready"}>
        {status === "ready" ? "OnChain Imprints" : "Loading..."}
      </button>
    </>
  );
}
```

## Testing Integration Locally

### 1. Start Full Stack (5 terminals)

```bash
# Terminal 1
npx hardhat node

# Terminal 2
node worker/relayerStub.js

# Terminal 3
npx hardhat run scripts/deploy.ts --network localhost

# Terminal 4
pnpm server:dev

# Terminal 5
pnpm dev
```

### 2. Verify Data Flow

In browser console:

```javascript
// 1. Check FHEVM instance loaded
window.fhevm  // Should exist

// 2. Check relayer stub is reachable
fetch("http://localhost:3000/api/status")
  .then(r => r.json())
  .then(console.log)
// Should return { status: "healthy", relayerAddress: "0x..." }

// 3. Submit a test entry
// Click "OnChain Imprints" button in UI

// 4. Verify on-chain storage
// Check browser console for transaction hash
// Visit: http://localhost:8545 (Hardhat JSON-RPC) or Etherscan if Sepolia
```

### 3. Check Contract State

```bash
# Query contract for stored entry
cast call 0x<VEILSCORE> \
  "getEntry(address)(bytes32,bool,uint256)" \
  0x<USER_ADDRESS> \
  --rpc-url http://localhost:8545
```

## Debugging Checklist

| Issue | Debug Steps |
|-------|-------------|
| FHEVM instance not ready | Check SDK loaded in index.html; verify relayerInit.ts called |
| Relayer evaluation fails | Check relayer stub is running; verify POST /api/evaluate works |
| Contract submission fails | Check signature verification; verify relayer address matches contract's |
| Encrypted data looks wrong | Check encrypt call in FHEVM instance; verify tier value before encryption |
| On-chain data not stored | Check submitWithSig() was called, not submit(); verify gas estimate |

## Privacy Model Switch (Future)

To upgrade from **Model 2 (Relayer-Signed)** to **Model 1 (Encrypted)**:

1. **Relayer change**: Request `evaluateEncrypted()` instead of `evaluate()`
   ```typescript
   const encryptedResult = await relayer.evaluateEncrypted(encryptedInput);
   ```

2. **Client decryption**: Decrypt result locally
   ```typescript
   const decrypted = await instance.decrypt(encryptedResult);
   ```

3. **User signing**: Sign locally (requires MetaMask or passkey)
   ```typescript
   const signature = await signer.signMessage(
     ethers.getAddress(commitment, decrypted)
   );
   ```

4. **Contract call**: Use encrypted signature (Model 1 contract method)
   ```typescript
   await contract.submitWithEncryptedSig(
     commitment,
     encryptedResult,
     userSignature  // user's signature, not relayer's
   );
   ```

See [RELAYER_ARCHITECTURE.md](RELAYER_ARCHITECTURE.md) for full privacy model explanations.

## Monitoring & Alerts

Once deployed:

- **Monitor relayer health**: GET `/api/status` endpoint
- **Track submission success rate**: Count `EntrySubmitted` events
- **Alert on signature failures**: Watch for contract revert logs
- **Monitor gas costs**: Track average `submitWithSig()` transaction cost

## References

- [VeilScore.sol](../contracts/VeilScore.sol) - Contract with `submitWithSig()`
- [zama.ts](../apps/web/src/lib/zama.ts) - Encryption pipeline
- [useFhevm.ts](../apps/web/src/lib/useFhevm.ts) - FHEVM instance hook
- [relayerStub.js](../worker/relayerStub.js) - Local testing relayer
- [RELAYER_ARCHITECTURE.md](./RELAYER_ARCHITECTURE.md) - Privacy models & design
