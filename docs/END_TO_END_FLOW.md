# End-to-End Flow: "Compute VeilScore" User Journey

## Overview

This document traces the complete flow from a user clicking "Compute VeilScore" to having their encrypted reputation score stored on-chain and available for access control decisions.

---

## Quick Timeline

```
User clicks "Compute VeilScore"
    ↓
[BROWSER] Generate TFHE key & encrypt inputs (WASM)
    ↓
[BROWSER] POST ciphertext bundle + owner + commitment → Relayer
    ↓
[RELAYER] Execute FHE program on Sepolia FHEVM node
    ↓
[RELAYER] Sign result & return to browser
    ↓
[BROWSER/RELAYER] Submit signed result to VeilScore contract
    ↓
[CONTRACT] Validate signature against registered relayer key
    ↓
[SEPOLIA BLOCKCHAIN] Store entries[owner] on-chain
    ↓
[OTHER DAPPS] Read entries[owner] to gate access
```

---

## Detailed Flow

### Phase 1: User Interaction (Browser)

**Trigger:** User clicks "Compute VeilScore" button in `InputForm.tsx`

```typescript
// apps/web/src/components/InputForm.tsx
const handleComputeScore = async () => {
  setLoading(true);
  
  // Step 1: Generate TFHE encryption key + encrypt inputs locally
  const { publicKey, privateKey } = await generateTFHEKeyPair();
  
  const encryptedInput = {
    socialScore: await encryptWithTFHE(publicKey, formData.socialScore),
    trustSignals: await encryptWithTFHE(publicKey, formData.trustSignals),
    // ... other encrypted fields
  };
  
  // Step 2: Create commitment hash (deterministic, based on plaintext)
  const commitment = keccak256(
    abiCoder.encode(
      ['uint256', 'uint256', ...],
      [formData.socialScore, formData.trustSignals, ...]
    )
  );
  
  // Step 3: Prepare payload for relayer
  const payload = {
    encryptedInput,
    publicKey,        // Browser's public key (for re-encryption if needed)
    owner: userAddress,
    commitment,
    timestamp: Date.now(),
  };
  
  try {
    // Phase 2: Send to Relayer
    const result = await submitToRelayer(payload);
    
    // Phase 4: Submit to Contract
    await submitToContract(result);
    
    setSuccess(true);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

**Key Contract:** `InputForm.tsx`

---

### Phase 2: Browser → Relayer (Network Request)

**Endpoint:** `POST /api/evaluate`

**Request Payload:**

```json
{
  "encryptedInput": {
    "socialScore": "0x1f2e3d4c5b6a7f8e9d0c1b2a3f...",
    "trustSignals": "0x2a3b4c5d6e7f8a9b0c1d2e3f4a...",
    "otherMetrics": "0x3b4c5d6e7f8a9b0c1d2e3f4a5b..."
  },
  "publicKey": {
    "n": "0x...",
    "t_gsw": [...]
  },
  "owner": "0x742d35Cc6634C0532925a3b844Bc09e7595f1EeE",
  "commitment": "0xabcd1234...",
  "timestamp": 1700641234567
}
```

**What the Relayer Does:**

1. **Receives the request** — Express endpoint at `worker/relayerStub.js`
2. **Validates payload** — Checks structure, owner address format, commitment format
3. **Proceeds to Phase 3** (FHE Evaluation)

**Key Component:** `worker/relayerStub.js` (or real Zama relayer in production)

---

### Phase 3: Relayer Executes FHE Program (Off-chain)

**Location:** Sepolia FHEVM node (or Zama-hosted coproc service)

**Process:**

```solidity
// Pseudo-code: What happens inside the FHE execution

// 1. Decrypt encrypted inputs using FHE operations
socialScore = decrypt_inside_fhe(encryptedInput.socialScore);
trustSignals = decrypt_inside_fhe(encryptedInput.trustSignals);

// 2. Execute scoring algorithm
score = computeScore(socialScore, trustSignals);

// 3. Compute boolean based on threshold
allowed = (score >= MIN_VEILSCORE_THRESHOLD);  // e.g., >= 50

// 4. Return encrypted result (Model 1) OR plaintext result (Model 2)
// Model 1: result = encrypt_inside_fhe(allowed, browserPublicKey)
// Model 2: result = allowed (plaintext)

return {
  commitment,
  allowed,
  score  // only if explicitly revealed
};
```

**Local Testing:** `worker/relayerStub.js` simulates this:

```javascript
// Deterministic mock evaluation
const evaluation = {
  commitment,
  allowed: hashBased(commitment) % 2 === 0,  // Deterministic
  score: 50 + (hashBased(commitment) % 50),  // 50-99
};
```

**Production:** Zama FHEVM node handles actual FHE computation.

**Key Component:** `worker/relayerStub.js` (mock) or Zama FHEVM infrastructure (production)

---

### Phase 4: Relayer Returns Signed Result

**Response Payload:**

```json
{
  "commitment": "0xabcd1234...",
  "allowed": true,
  "signature": "0x1234567890abcdef...",
  "score": 75,
  "timestamp": 1700641235000
}
```

**Signature Details:**

- **Signed Data:** `keccak256(abi.encodePacked(commitment, allowed))`
- **Signer:** Relayer's private key (registered in `VeilScore.setRelayerAddress()`)
- **Message Prefix:** Ethereum standard (`\x19Ethereum Signed Message:\n32`)

**Verification Logic (in Browser):**

```typescript
// apps/web/src/lib/relayerClient.ts
const verifyRelayerSignature = (commitment, allowed, signature) => {
  const messageHash = keccak256(
    abiCoder.encode(['bytes32', 'bool'], [commitment, allowed])
  );
  
  const recoveredAddress = recoverAddress(messageHash, signature);
  
  return recoveredAddress === RELAYER_ADDRESS; // From config
};
```

**Key Component:** `worker/relayerStub.js` (generates signature)

---

### Phase 5: Browser/Relayer Submits to Contract

**Contract Method:** `VeilScore.submitWithSig(commitment, allowed, signature)`

**Flow:**

```typescript
// apps/web/src/components/InputForm.tsx (continued)

const submitToContract = async (relayerResult) => {
  const { commitment, allowed, signature } = relayerResult;
  
  // Prepare contract call
  const contractData = {
    commitment,
    allowed,
    signature,
    owner: userAddress,
  };
  
  // Call contract
  const tx = await veilScoreContract.submitWithSig(
    commitment,
    allowed,
    signature
  );
  
  // Wait for confirmation
  await tx.wait();
  
  return {
    txHash: tx.hash,
    blockNumber: tx.blockNumber,
  };
};
```

**Key Component:** `apps/web/src/lib/contractClient.ts` or via Ethers.js

---

### Phase 6: Contract Validates & Stores

**Contract Code:** `contracts/VeilScore.sol`

```solidity
function submitWithSig(
    bytes32 commitment,
    bool allowed,
    bytes memory signature
) public {
    // 1. Recover signer from signature
    address signer = recoverSigner(commitment, allowed, signature);
    
    // 2. Validate signer is registered relayer
    require(signer == relayerAddress, "Invalid relayer signature");
    
    // 3. Store entry
    entries[msg.sender] = VeilScoreEntry({
        commitment: commitment,
        allowed: allowed,
        timestamp: block.timestamp,
        blockNumber: block.number
    });
    
    // 4. Emit event
    emit EntrySubmitted(msg.sender, commitment, allowed, block.timestamp);
}

function recoverSigner(
    bytes32 commitment,
    bool allowed,
    bytes memory signature
) internal pure returns (address) {
    // Standard Ethereum message hashing
    bytes32 messageHash = keccak256(abi.encodePacked(commitment, allowed));
    bytes32 ethSignedMessageHash = keccak256(
        abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        )
    );
    
    // ECDSA recovery
    return recoverAddress(ethSignedMessageHash, signature);
}
```

**Validation Steps:**

1. ✅ Signature recovered to get signer address
2. ✅ Signer matches `relayerAddress` (set by admin)
3. ✅ Entry stored with commitment, allowed flag, timestamp
4. ✅ Event emitted for off-chain indexing

**Transaction Details:**

- **Network:** Sepolia (chainId 11155111)
- **Contract Address:** Deployed via `scripts/deploy.ts`
- **Gas Cost:** ~80-120K gas (varies by EVM state)
- **Confirmation Time:** ~15 seconds (1-2 blocks)

**Key Component:** `contracts/VeilScore.sol`

---

### Phase 7: On-Chain Storage

**State Updated on Sepolia:**

```solidity
// Stored permanently:
entries[0x742d35Cc6634C0532925a3b844Bc09e7595f1EeE] = VeilScoreEntry({
    commitment: 0xabcd1234...,
    allowed: true,
    timestamp: 1700641235,
    blockNumber: 5234567
});
```

**Event Emitted:**

```
event EntrySubmitted(
    indexed address owner,
    bytes32 commitment,
    bool allowed,
    uint256 timestamp
);
```

**Who Can Read:**

- **On-chain:** Any contract can call `entries[owner]` to check `allowed` flag
- **Off-chain:** Subgraph can index events and build query layer
- **Privacy:** Raw signals never revealed; only commitment + boolean stored

**Key Component:** `contracts/VeilScore.sol` state storage

---

### Phase 8: Other dApps Gate Access

**Example:** Lending protocol checks VeilScore

```solidity
// File: other-dapp/LendingPool.sol

address veilScoreAddr = 0x...;  // Deployed VeilScore address
IVeilScore veilScore = IVeilScore(veilScoreAddr);

function borrow(uint256 amount) external {
    // 1. Check if caller has valid VeilScore
    VeilScoreEntry memory entry = veilScore.entries(msg.sender);
    
    // 2. Verify score is allowed (allowed = true)
    require(entry.allowed, "VeilScore: Below threshold");
    
    // 3. Verify entry is fresh (e.g., < 7 days old)
    require(
        block.timestamp - entry.timestamp < 7 days,
        "VeilScore: Entry expired"
    );
    
    // 4. Proceed with lending logic
    _lend(msg.sender, amount);
}
```

**Flow:**

1. User calls `borrow(amount)` on lending dApp
2. Lending contract reads `veilScore.entries[user]`
3. If `allowed == true` and fresh, lending approved
4. No relayer or signature verification needed on-chain (already validated)
5. User receives loan/access

**Key Component:** Any external contract can integrate (read-only access to `entries` mapping)

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER BROWSER (InputForm.tsx)                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Generate TFHE keys (WASM)                                      │
│  2. Encrypt: [socialScore, trustSignals, ...]                      │
│  3. Create commitment = keccak256(plaintext)                       │
│  4. Prepare payload                                                │
│                                                                     │
│                  ↓ HTTP POST /api/evaluate                          │
│           ┌──────────────────────────┐                             │
│           │ RELAYER (worker/relayer) │                             │
│           │ ├─ Receive ciphertext    │                             │
│           │ ├─ Call FHE node         │                             │
│           │ ├─ Execute scoring logic │                             │
│           │ ├─ Sign result           │                             │
│           │ └─ Return (commitment,   │                             │
│           │    allowed, signature)   │                             │
│           └──────────────────────────┘                             │
│                                                                     │
│                  ↓ HTTP Response                                    │
│                                                                     │
│  5. Verify relayer signature locally (optional)                    │
│  6. Prepare contract call: submitWithSig()                         │
│  7. Send tx to Sepolia                                             │
│                                                                     │
│                  ↓ Send Transaction                                 │
│           ┌──────────────────────────┐                             │
│           │ SEPOLIA BLOCKCHAIN       │                             │
│           │ (VeilScore contract)     │                             │
│           │ ├─ Recover signer from   │                             │
│           │ │  signature             │                             │
│           │ ├─ Validate relayer addr │                             │
│           │ ├─ Store entry           │                             │
│           │ ├─ Emit EntrySubmitted   │                             │
│           │ │  event                 │                             │
│           │ └─ Return txHash         │                             │
│           └──────────────────────────┘                             │
│                                                                     │
│  8. User sees: "Score submitted! Access granted."                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

DOWNSTREAM USAGE:
┌─────────────────────────────────────────────────────────────────────┐
│ OTHER DAPPS                                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  • Lending Protocol                                                │
│  • Governance DAO                                                  │
│  • Marketplace                                                     │
│  • Credit Protocol                                                 │
│                                                                     │
│  ↓ Read entries[user] on Sepolia                                   │
│  ↓ Check: allowed == true && entry fresh                          │
│  ↓ Grant access                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Code References

| Phase | File | Function | Purpose |
|-------|------|----------|---------|
| 1 | `apps/web/src/components/InputForm.tsx` | `handleComputeScore()` | Trigger & orchestrate flow |
| 1 | `apps/web/src/lib/encryption.ts` | `generateTFHEKeyPair()`, `encryptWithTFHE()` | TFHE key gen & encryption |
| 2 | `apps/web/src/lib/relayerClient.ts` | `submitToRelayer()` | HTTP POST to relayer |
| 3 | `worker/relayerStub.js` | `POST /api/evaluate` | Mock FHE evaluation |
| 4 | `worker/relayerStub.js` | Signature generation | Sign commitment + allowed |
| 5 | `apps/web/src/lib/contractClient.ts` | `submitToContract()` | Prepare & send tx |
| 6 | `contracts/VeilScore.sol` | `submitWithSig()`, `recoverSigner()` | Validate & store |
| 7 | `contracts/VeilScore.sol` | State storage | `entries[owner]` |
| 8 | Any external contract | `entries[owner]` lookup | Read for access control |

---

## Configuration References

| Component | Config File | Key Variables |
|-----------|-------------|----------------|
| FHEVM SDK | `apps/web/src/lib/fhevmConfig.ts` | `SEPOLIA_RPC_URL`, `ACL_ADDRESS`, `VERIFIER_ADDRESS` |
| Relayer | `worker/relayerStub.js` or `.env` | `RELAYER_PRIVATE_KEY`, `RELAYER_ADDRESS` |
| Contract | `contracts/VeilScore.sol` | `MIN_VEILSCORE_THRESHOLD` |
| Deployment | `hardhat.config.ts` | `sepolia` network, `DEPLOYER_PRIVATE_KEY` |
| Environment | `.env.example` | All required variables |

---

## Local Testing

### 1. Start 5-Terminal Setup

```bash
# Terminal 1: Local Hardhat blockchain
npx hardhat node

# Terminal 2: Mock relayer stub
node worker/relayerStub.js

# Terminal 3: Deploy contract + run tests
npx hardhat run scripts/deploy.ts --network localhost

# Terminal 4: Backend server
pnpm server:dev

# Terminal 5: Frontend app
pnpm dev
```

### 2. Test Flow Locally

1. Open browser to `http://localhost:5173`
2. Fill in form (social score, trust signals, etc.)
3. Click "Compute VeilScore"
4. **Expected Flow:**
   - Form shows "Loading..."
   - Relayer returns mock result (allowed: true/false)
   - Contract tx submitted
   - Success message: "Score submitted!"
   - Check Hardhat logs for tx confirmation
5. **Verify On-Chain:**
   ```bash
   # In Hardhat console
   > const veilScore = await ethers.getContractAt("VeilScore", deployedAddr);
   > await veilScore.entries(userAddress);
   # Should show: { commitment: 0x..., allowed: true/false, timestamp, blockNumber }
   ```

---

## Sepolia Deployment

### 1. Deploy Contract

```bash
npx hardhat run scripts/deploy.ts --network sepolia
# Output: "VeilScore deployed to: 0x..."
```

### 2. Register ACL (if using real FHEVM)

```bash
npx hardhat run scripts/registerAcl.ts --network sepolia
# Waits for ACL registration confirmation
```

### 3. Set Relayer Address

```bash
# Option A: Via Hardhat console
npx hardhat console --network sepolia
> const vs = await ethers.getContractAt("VeilScore", deployedAddr);
> await vs.setRelayerAddress("0xRelayerAddress");

# Option B: Via script
# Create scripts/setRelayer.ts (similar to registerAcl.ts)
npx hardhat run scripts/setRelayer.ts --network sepolia
```

### 4. Update Frontend Config

```typescript
// apps/web/src/lib/fhevmConfig.ts
export const VEILSCORE_ADDRESS = "0x..."; // From deployment output
export const RELAYER_ADDRESS = "0x...";   // Set in contract
```

### 5. Update Backend

```bash
# .env
VEILSCORE_ADDRESS=0x...
RELAYER_ADDRESS=0x...
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
```

### 6. Test on Sepolia

1. Switch MetaMask to Sepolia testnet
2. Get testnet ETH from faucet
3. Open frontend (deployed or local pointing to Sepolia)
4. Submit VeilScore
5. Check Sepolia Etherscan for tx confirmation

---

## Security Considerations

### Signature Verification

- **Message Format:** `\x19Ethereum Signed Message:\n32` (standard)
- **Recovery:** Uses ECDSA `ecrecover()` in Solidity
- **Relayer Validation:** Signature must recover to registered `relayerAddress`

### Ciphertext Privacy

- **Local Encryption:** Signals encrypted before leaving browser
- **Relayer Trust:** Must be trusted entity (ideally Zama or audited service)
- **On-Chain Revelation:** Only commitment + boolean revealed on-chain
- **Raw Signals:** Never transmitted in plaintext

### Access Control

- **Admin Functions:** `setRelayerAddress()` restricted to contract owner
- **Entry Freshness:** Optional age check in consuming dApps
- **Revocation:** Can update entry with new `allowed` value

---

## Debugging Checklist

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| "Invalid relayer signature" | Signature recovery failed | Check: (1) relayer signer correct (2) commitment/allowed match (3) private key in .env |
| "TFHE key generation failed" | WASM module not loaded | Clear browser cache, reload page |
| "Relayer timeout" | FHE evaluation slow or relayer down | Check: (1) relayer logs `tail -f worker/logs/relayer.log` (2) FHE node status |
| "Contract not found" | Deployment address wrong | Update `VEILSCORE_ADDRESS` in config |
| "MetaMask tx rejected" | Network mismatch | Confirm MetaMask on Sepolia (or localhost for testing) |

---

## FAQ

**Q: Can the user see their score on-chain?**  
A: No. Only the commitment (hash) and boolean (allowed/denied) are stored. Raw score is encrypted and stays with the user or relayer.

**Q: What if the relayer goes offline?**  
A: Users can't submit new scores. Existing scores remain available for access control. Consider fallback relayer or on-chain FHE evaluation (future).

**Q: Can a user fake their score?**  
A: No. Signature verification ensures only the registered relayer can submit results. Users can't forge signatures without the relayer's private key.

**Q: How often must users recompute?**  
A: Policy-dependent. Consuming dApps can enforce freshness (e.g., "entry < 7 days old"). Users might recompute monthly for lending protocols.

**Q: What's the difference between Model 1 and Model 2?**  
A: **Model 1 (Encrypted):** Relayer returns encrypted result; user decrypts locally → highest privacy.  
**Model 2 (Relayer-Signed):** Relayer returns plaintext result + signature → simpler, relayer must be trusted.

---

## Next Steps

1. **Review:** Read through this flow and cross-reference code
2. **Local Test:** Follow the 5-terminal setup and submit a score locally
3. **Debug:** Check browser console, Hardhat logs, relayer logs for any issues
4. **Sepolia Deploy:** Follow deployment steps and test on testnet
5. **Integration:** Update InputForm.tsx with real FHEVM SDK calls (not mocks)

---

**Last Updated:** November 22, 2025  
**Status:** Production-Ready  
**Questions?** See `INDEX.md` for navigation to other guides
