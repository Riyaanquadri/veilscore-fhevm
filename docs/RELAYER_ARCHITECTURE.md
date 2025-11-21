# Relayer Architecture & Privacy Considerations

This document explains critical design decisions for VeilScore's relayer integration, including privacy tradeoffs, authority delegation, and testing strategies.

## Privacy Models: Encrypted vs. Plaintext Authority

### Model 1: Encrypted Boolean (Highest Privacy) ⭐ Recommended

**Flow:**
1. User submits encrypted signals to relayer
2. Relayer computes inside FHEVM → **encrypted boolean result**
3. Relayer returns encrypted boolean to client
4. User **decrypts locally** (only user has private key)
5. User signs `(commitment, decrypted_boolean)` locally
6. User submits signed message to contract via `submitWithSig()`
7. Contract verifies signature + stores result

**Advantages:**
- ✅ Relayer never sees plaintext result (cannot lie about evaluation)
- ✅ Only user knows their score/gate status
- ✅ Contract verifies relayer signature on encrypted blob only
- ✅ Maximum privacy for sensitive reputation data

**Disadvantages:**
- ⚠️ Requires user-side decryption (needs private key locally)
- ⚠️ More complex flow (3 roundtrips)
- ⚠️ User must sign; cannot fully automate submission

**When to use:**
- Production deployments with privacy-sensitive reputation
- Multi-user scenarios where scores should stay private
- Regulatory compliance (e.g., GDPR data minimization)

### Model 2: Relayer-Signed Boolean (Demo Simplicity) 📱 Current

**Flow:**
1. User submits encrypted signals to relayer
2. Relayer computes inside FHEVM → plaintext boolean
3. Relayer signs `(commitment, boolean)` with relayer key
4. Relayer returns signed tuple to client
5. Client submits to contract via `submitWithSig(relayer_signature)`
6. Contract verifies relayer signature + stores result

**Advantages:**
- ✅ Simple client flow (1-2 roundtrips)
- ✅ Can be fully automated (no user signing required)
- ✅ Good for demos and initial testing
- ✅ Relayer commitment is on-chain (auditable)

**Disadvantages:**
- ⚠️ Relayer is trusted authority (must not be compromised)
- ⚠️ Relayer could lie about plaintext result
- ⚠️ All users' booleans visible on-chain after submission

**When to use:**
- MVP/demo phases
- Internal testnets
- Scenarios where relayer is trusted (same organization)
- When full automation is required

---

## Switching Between Models

Current VeilScore uses **Model 2 (Relayer-Signed)** for simplicity. To upgrade to **Model 1 (Encrypted)**:

### Changes Needed

1. **Relayer SDK call**: Instead of requesting plaintext `evaluateEncrypted()`, request encrypted result
   ```typescript
   // Model 2 (current)
   const result = await relayer.evaluate(encryptedInput);  // plaintext
   
   // Model 1 (future)
   const encryptedResult = await relayer.evaluateEncrypted(encryptedInput);  // still encrypted
   ```

2. **Client decryption**: Add decryption step
   ```typescript
   const decrypted = await fhevmInstance.decrypt(encryptedResult);
   ```

3. **Signing**: User signs locally
   ```typescript
   const signature = await signer.signMessage(ethers.getAddress(commitment, decrypted));
   ```

4. **Contract submission**: Uses `submitWithSig(signature)`
   ```solidity
   function submitWithSig(bytes32 commitment, bool allowed, bytes calldata signature) external {
     bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, commitment, allowed));
     require(verifySignature(messageHash, signature, relayerAddress), "Invalid relayer signature");
     entries[msg.sender] = Entry(msg.sender, commitment, allowed, block.timestamp);
   }
   ```

---

## ACL Admin Privileges & Registration

### Who Controls the ACL?

The **ACL (Access Control List)** contract is deployed and controlled by **Zama** or the **FHEVM network operator**. As a dApp developer:

- ✅ You can **view** the ACL
- ❌ You **cannot directly call** `registerContract()` unless you're the admin
- ❌ You **cannot** register your own contract

### Two Paths to Registration

#### Path A: Self-Service Dashboard (If Available)

If Zama provides a **web dashboard** or **CLI tool**:

```bash
# Example (hypothetical)
zama-cli register-contract \
  --network sepolia \
  --contract-address 0x<VEILSCORE> \
  --api-key <YOUR_KEY>
```

Check: https://docs.zama.ai/fhevm/guides/deployment

#### Path B: GitHub PR or Admin Request

If no dashboard exists:

1. **Find the ACL repo** (e.g., `zama-protocol/fhevm-contracts`)
2. **Create an issue** or **PR** with:
   - VeilScore contract address
   - Contract name and brief description
   - Why you need registration
   - Network (Sepolia)
3. **Wait for Zama admin approval** (usually 24-48 hours)
4. **Admin merges PR** → ACL updated on-chain
5. **Verify on Etherscan**: Call `isContractRegistered(0x<VEILSCORE>)`

### Handling Admin-Gated Registration

Our `registerAcl.ts` script gracefully handles this:

```typescript
// If you don't have admin permissions, this will fail with clear error:
// "Error: caller is not the admin"

// In that case, follow Path B (GitHub PR) and contact Zama
```

**Current Script Behavior:**
- ✅ Checks if contract is already registered (no-op if yes)
- ✅ Attempts registration (will fail if not admin)
- ✅ Provides clear error message with next steps
- ✅ Returns non-zero exit code for CI/CD pipelines

---

## Relayer SDK Configuration

### Built-In Sepolia Config

The Zama relayer SDK ships with **pre-configured Sepolia addresses**:

```typescript
// sdk.SepoliaConfig is baked into the SDK
const defaultConfig = {
  chainId: 11155111,
  aclContractAddress: "0x2aebcdc4ef0eb9b2dc5bb75060f7e3a4b5d5c5b0",
  inputVerifierAddress: "0x...",
  kmsVerifierAddress: "0x...",
  relayerUrl: "https://relayer.api.zama.ai/"
};
```

### When to Override

**Use SDK's built-in config UNLESS:**

1. **Testing locally**: Point to `localhost:3000` for local relayer stub
2. **Custom relayer**: You've deployed your own relayer (advanced)
3. **Staging network**: Different verifier addresses than mainnet

### Our Approach (Adaptive)

`useFhevm.ts` hook automatically:

```typescript
1. Check if sdk.SepoliaConfig exists (use if yes) ✅
2. Fall back to manual config from fhevmConfig.ts (if no)
3. Always include mockChains for localhost override
```

This gives maximum flexibility without forcing config changes.

---

## Testing: Local Relayer Stub

### Why Test Locally?

- ✅ **Fast iteration**: No Sepolia gas costs, no waiting for transactions
- ✅ **Deterministic**: Hardhat node always produces same results
- ✅ **Offline**: Test without network access
- ✅ **Debugging**: Inspect every step of FHE computation

### Local Test Architecture

```
┌─────────────┐
│   Hardhat   │  Local blockchain (chainId 31337)
│    Node     │  VeilScore contract deployed here
└──────┬──────┘
       │
       └──► mockChains[31337] → "http://localhost:3000"
            (routes to local relayer stub)

┌─────────────────┐
│  Local Relayer  │  Simulates FHE evaluation
│  Stub (worker)  │  Returns encrypted/signed results
└─────────────────┘
       │
       └──► worker/relayerStub.js
            - Mocks FHE computation
            - Signs results
            - Returns to client
```

### Setting Up Local Relay Stub

Create `worker/relayerStub.js`:

```javascript
/**
 * Local Relayer Stub for Testing
 * Simulates Zama relayer without network roundtrips
 */

const express = require("express");
const { ethers } = require("ethers");

const app = express();
app.use(express.json());

// Mock relayer signer (for testing only!)
const RELAYER_PRIVATE_KEY =
  "0x0000000000000000000000000000000000000000000000000000000000000001";
const relayerSigner = new ethers.Wallet(RELAYER_PRIVATE_KEY);

app.post("/api/evaluate", async (req, res) => {
  const { encryptedInput, inputProof } = req.body;

  try {
    // Simulate FHE computation inside FHEVM
    // In production, this would call actual FHE precompile
    const mockResult = {
      commitment: ethers.keccak256(encryptedInput),
      allowed: Math.random() > 0.5, // Simulate random gate result
      evaluatedAt: Math.floor(Date.now() / 1000),
    };

    // Sign result (Model 2: Relayer-Signed)
    const messageHash = ethers.solidityPackedKeccak256(
      ["bytes32", "bool"],
      [mockResult.commitment, mockResult.allowed]
    );
    const signature = await relayerSigner.signMessage(
      ethers.getBytes(messageHash)
    );

    res.json({
      commitment: mockResult.commitment,
      allowed: mockResult.allowed,
      signature,
      relayerAddress: relayerSigner.address,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Local Relayer Stub listening on http://localhost:3000");
  console.log(`Relayer Address: ${relayerSigner.address}`);
});
```

### Running Local Tests

```bash
# Terminal 1: Hardhat node
npx hardhat node

# Terminal 2: Local relayer stub
node worker/relayerStub.js

# Terminal 3: Deploy to localhost
npx hardhat run scripts/deploy.ts --network localhost

# Terminal 4: Frontend (automatically uses mockChains mapping)
pnpm dev
```

Frontend will automatically:
1. Detect chainId 31337 (Hardhat)
2. Route to `http://localhost:3000` (local stub)
3. Test full FHE flow without Sepolia gas

---

## Configuration Decision Tree

```
START
  │
  ├─ Are you testing locally?
  │  YES → Use mockChains[31337] + local relayer stub
  │  NO  → Continue
  │
  ├─ Is SDK.SepoliaConfig available?
  │  YES → Use it (no override needed)
  │  NO  → Use fhevmConfig.ts fallback
  │
  └─ Are you on Sepolia?
     YES → Verify ACL registration via cast
     NO  → Skip ACL check
```

---

## Security Checklist

- [ ] **Relayer trust model** chosen (encrypted vs. plaintext)
- [ ] **ACL registration** verified on Sepolia (if applicable)
- [ ] **Local testing** complete with relayer stub
- [ ] **Signature verification** implemented in contract
- [ ] **Private key** never logged or transmitted
- [ ] **SDK config** obtained from official Zama docs
- [ ] **Mock chains** configured for localhost testing
- [ ] **Environment variables** use `.env` (never hardcoded)

---

## References

- [Zama FHEVM Relayer Docs](https://docs.zama.ai/fhevm/guides/relayer)
- [FHEVM ACL Registration](https://docs.zama.ai/fhevm/guides/acl)
- [VeilScore Contract](../contracts/VeilScore.sol) - `submitWithSig` implementation
- [useFhevm Hook](../apps/web/src/lib/useFhevm.ts) - Adaptive config logic
- [fhevmConfig](../apps/web/src/lib/fhevmConfig.ts) - Manual Sepolia config
