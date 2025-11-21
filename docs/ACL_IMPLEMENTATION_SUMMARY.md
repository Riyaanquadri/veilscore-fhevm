# ACL & Input Verifier Registration - Implementation Summary

## What Was Added

### 1. ACL Registration Script (`scripts/registerAcl.ts`)

A comprehensive Hardhat script that handles registering VeilScore in the Zama FHEVM ACL contract.

**Features:**
- ✅ Pattern A: Onchain ACL registration (primary method)
- ✅ Pattern B: Relayer signature verification setup (advanced)
- ✅ Balance checking (prevents submission if deployer has 0 ETH)
- ✅ Pre-registration check (avoids redundant transactions)
- ✅ Error handling with helpful messages
- ✅ Support for both `VITE_VEILSCORE_ADDRESS` and `VEILSCORE_ADDRESS` env vars

**How to Use:**

```bash
# Ensure VeilScore is deployed first
npx hardhat run scripts/deploy.ts --network sepolia

# Then register in ACL
npx hardhat run scripts/registerAcl.ts --network sepolia
```

**Output Example:**
```
=== VeilScore ACL Registration ===

Configuration:
  VeilScore Address:    0x...
  ACL Contract Address: 0x...
  Network:              Sepolia (11155111)

Deployer Address: 0x...
Deployer Balance: 0.5 ETH

--- Pattern A: Onchain ACL Registration ---
Registering VeilScore (0x...) in ACL...
   Transaction hash: 0x...
✅ Successfully registered in ACL!

✅ Registration complete!
```

### 2. Documentation (`docs/ACL_REGISTRATION.md`)

**Comprehensive guide covering:**

1. **Two Trust Patterns:**
   - Pattern A: Onchain ACL (relayer reads contract list)
   - Pattern B: Relayer signatures (contract verifies relayer sig)

2. **VeilScore Implementation:**
   - Currently uses Pattern A approach (simple `submit()`)
   - No signature verification needed
   - Must register in ACL for relayer to trust it

3. **Step-by-Step Registration:**
   - Deploy to Sepolia
   - Find official ACL contract address from Zama docs
   - Run registration script
   - Verify with `cast` command

4. **Troubleshooting:**
   - Deployer account funding
   - ACL ABI mismatches
   - Failed registrations

5. **Next Steps:**
   - InputForm integration
   - Real encryption replacement
   - End-to-end testing

### 3. Updated README.md

**New sections:**
- Complete "Getting Started" workflow (local → Sepolia → Vercel)
- Deployment to Sepolia (deploy + register steps)
- Project structure overview
- Data flow diagram
- Troubleshooting section
- References to documentation

**Key additions:**
- Prerequisites (Node, pnpm, Sepolia ETH, RPC endpoint)
- Environment setup with `.env.example`
- Zama FHEVM configuration details
- Relayer SDK integration notes
- Vercel deployment guide

### 4. Environment Template (`.env.example`)

Updated with all Sepolia/FHEVM variables:

```bash
# Hardhat & Contract Deployment
DEPLOYER_PRIVATE_KEY=your_deployer_private_key_here
HARDHAT_RPC_URL=http://127.0.0.1:8545

# Sepolia FHEVM Testnet
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
SEPOLIA_RELAYER_URL=https://relayer.api.zama.ai/
VITE_ZAMA_RELAYER_KEY=your_zama_relayer_key_here

# FHEVM Configuration
VITE_VEILSCORE_ADDRESS=0x...deployed_contract_address_here
VITE_API_BASE_URL=http://localhost:4000

# Signal Fetching APIs
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC_URL=https://mainnet.optimism.io
```

### 5. FHEVM Infrastructure Files (Previously Created)

Already in place from earlier commits:
- `apps/web/src/lib/fhevmConfig.ts` - Sepolia config constants
- `apps/web/src/lib/useFhevm.ts` - React hook for FHEVM instance
- `apps/web/src/lib/relayerInit.ts` - Relayer SDK initialization
- `hardhat.config.ts` - Sepolia network config with DEPLOYER_PRIVATE_KEY
- `apps/web/index.html` - Zama relayer SDK CDN script

## Two Registration Patterns Explained

### Pattern A: Onchain ACL (Primary) ✅ Implemented

The relayer maintains an Access Control List (ACL) contract on Sepolia:

```solidity
// Pseudo-code
interface IACL {
  function registerContract(address contractAddress) external;
  function isContractRegistered(address contractAddress) external view returns (bool);
}
```

**Flow:**
1. You deploy VeilScore
2. You call `registerContract(VeilScore)` on the ACL
3. Relayer reads ACL before accepting submissions
4. If VeilScore is in ACL, relayer trusts it
5. Relayer evaluates encrypted data and returns results

**When to use:** Production contracts, maximum compatibility

### Pattern B: Relayer Signatures (Advanced) 🔧 Optional

Your contract verifies that evaluations are signed by the relayer:

```solidity
// Pseudo-code
contract VeilScore {
  address relayerAddress;
  
  function submitWithSig(
    bytes calldata input,
    bytes calldata signature
  ) external {
    // Verify relayer signed this evaluation
    require(verify(relayerAddress, input, signature));
    // Process encrypted input...
  }
}
```

**When to use:** Additional security, fine-grained control, custom rules

## Deployment Workflow

```
1. Fund Deployer Account
   └─ Get Sepolia ETH from faucet

2. Deploy VeilScore
   └─ npx hardhat run scripts/deploy.ts --network sepolia
   └─ Update VITE_VEILSCORE_ADDRESS

3. Register in ACL
   └─ npx hardhat run scripts/registerAcl.ts --network sepolia
   └─ Verify with: cast call <ACL> "isContractRegistered(address)(bool)" <VEILSCORE>

4. Deploy Frontend & Backend
   └─ Push to GitHub
   └─ Create Vercel projects
   └─ Update VITE_API_BASE_URL

5. Test End-to-End
   └─ User prefills signals
   └─ Encrypt + submit to contract
   └─ Relayer evaluates
   └─ Result stored on-chain
```

## Next Steps for Integration

1. **Integrate `useFhevm` hook into `InputForm.tsx`**
   - Get FHEVM instance with status tracking
   - Check if instance is "ready" before encryption

2. **Replace mock encryption**
   - Replace `encryptWithTFHE()` with real `instance.encrypt*()` calls
   - Use Zama SDK methods instead of JSON serialization

3. **Replace mock evaluation**
   - Replace `callFHECompute()` with relayer SDK calls
   - Use actual evaluation endpoint instead of local simulation

4. **Deploy to Sepolia**
   - Fund deployer account
   - Run deploy script
   - Run register script
   - Test full flow

5. **Production Setup**
   - Deploy frontend + backend to Vercel
   - Connect custom domain (optional)
   - Monitor transactions and events

## Key Files Reference

| File | Purpose |
|------|---------|
| `scripts/registerAcl.ts` | Register contract in ACL |
| `docs/ACL_REGISTRATION.md` | Registration guide + patterns |
| `README.md` | Updated with deployment steps |
| `.env.example` | Environment template |
| `hardhat.config.ts` | Sepolia network config |
| `apps/web/src/lib/fhevmConfig.ts` | FHEVM constants |
| `apps/web/src/lib/useFhevm.ts` | FHEVM React hook |
| `apps/web/src/lib/relayerInit.ts` | Relayer SDK init |

## Testing the Registration

```bash
# After registration, verify with:
VEILSCORE=0x...  # Your deployed address
ACL=0x2aebcdc4ef0eb9b2dc5bb75060f7e3a4b5d5c5b0  # Sepolia ACL
RPC=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

cast call $ACL "isContractRegistered(address)(bool)" $VEILSCORE --rpc-url $RPC
```

Expected output: `true`

## Security Considerations

✅ **Onchain ACL:**
- Relayer trusts any contract in ACL
- No off-chain state to manage
- Transparent and auditable
- Simple to verify

🔐 **Relayer Signatures:**
- Contract verifies relayer ownership
- Protects against unauthorized evaluations
- Requires relayer key management
- More complex but more secure

**Recommendation:** Use Pattern A for initial launch, add Pattern B later if needed.
