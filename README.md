# VeilScore — FHEVM dApp Demo

Private Reputation Oracle (VeilScore) — client-side encrypted signals computed via FHEVM to produce a single private score and threshold gating on-chain. 

## Architecture

- **Contracts**: `contracts/VeilScore.sol` stores a commitment (bytes32) and a boolean `allowed` flag per address. Minimal on-chain logic — all FHE computation happens off-chain on encrypted data.
- **Frontend**: `apps/web` is a Vite + React + TypeScript app that:
  - Collects user signals (Twitter followers, on-chain transaction counts)
  - Encrypts signals client-side using TFHE-rs WASM (`src/lib/zama.ts`)
  - Submits encrypted data for FHE evaluation (`src/lib/fheCompute.ts`)
  - Stores results on-chain via `src/lib/contract.ts`
- **Backend**: `apps/server` is an Express service that fetches public signals (Twitter followers, on-chain transaction counts) for prefilling user inputs.
- **FHE Integration**: Uses Zama TFHE-rs (WASM) for client-side encryption + Zama Relayer SDK for encrypted evaluation. Signals remain encrypted throughout the entire pipeline.

## Getting Started

### Want the complete user journey?

👉 Read **[docs/END_TO_END_FLOW.md](docs/END_TO_END_FLOW.md)** (15 min) — Traces exactly what happens when a user clicks "Compute VeilScore" from browser encryption to on-chain storage.

### Prerequisites

- **Node.js**: 18+
- **pnpm**: For monorepo management
- **Sepolia ETH**: For deploying and registering contracts (get from [Infura Faucet](https://www.infura.io/faucet/sepolia))
- **Infura/Alchemy Project**: For Sepolia RPC endpoint

### Local Development

1. **Install dependencies** (root + all workspaces):

```bash
pnpm install
```

2. **Set up environment variables** (copy `.env.example` to `.env`):

```bash
cp .env.example .env
# Edit .env and fill in:
# - DEPLOYER_PRIVATE_KEY (funded Sepolia account)
# - SEPOLIA_RPC_URL (Infura or Alchemy Sepolia endpoint)
# - TWITTER_BEARER_TOKEN (for signal fetching)
# - RPC URLs for Ethereum, Base, Arbitrum, Optimism
```

3. **Run tests**:

```bash
pnpm test
```

4. **Start local Hardhat node and services** (with local relayer stub):

```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy to localhost
npx hardhat run scripts/deploy.ts --network localhost

# Terminal 3: Start local relayer stub (simulates FHEVM relayer)
node worker/relayerStub.js

# Terminal 4: Start backend signal service
pnpm server:dev

# Terminal 5: Start frontend
pnpm dev
```

The frontend automatically detects localhost and routes FHEVM calls to the local relayer stub (http://localhost:3000) via the `mockChains` mapping in `useFhevm.ts`.

The frontend will be available at `http://localhost:5173`.

## Deploying to Sepolia

### 1. Deploy VeilScore Contract

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

This will output the deployed contract address. Update `.env`:

```bash
VITE_VEILSCORE_ADDRESS=0x<deployed_address>
```

### 2. Register in ACL (Relayer Trust)

The Zama relayer needs to know your contract is eligible for evaluation. Register it in the Sepolia ACL:

```bash
npx hardhat run scripts/registerAcl.ts --network sepolia
```

See [ACL_REGISTRATION.md](docs/ACL_REGISTRATION.md) for detailed explanation of registration patterns and troubleshooting.

### 3. Deploy Frontend & Backend

Push to GitHub and connect to Vercel:

- **Frontend** (`apps/web`): Deploy Vite app as static site
- **Backend** (`apps/server`): Deploy Node.js as serverless function (API)

Update frontend's `VITE_API_BASE_URL` to the Vercel backend URL and redeploy.

## Signal Fetch Service

`apps/server` hosts an Express service that pulls public metrics for prefilling user inputs.

### Environment Variables

Add to `.env`:

```bash
TWITTER_BEARER_TOKEN=your-twitter-bearer-token
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/...
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/...
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC_URL=https://mainnet.optimism.io
VITE_API_BASE_URL=http://localhost:4000  # Frontend
```

### Run the Service

```bash
pnpm server:dev
```

The signal API runs on `http://localhost:4000`.

## Zama FHEVM Configuration

### Sepolia Network Config

Edit `hardhat.config.ts` to ensure Sepolia is configured:

```typescript
sepolia: {
  url: process.env.SEPOLIA_RPC_URL,
  accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
  chainId: 11155111
}
```

### FHE Computation Pipeline

VeilScore performs **real encrypted threshold evaluation** using TFHE-rs. Here's how it works:

### Privacy Model

1. **Client Encryption** (`apps/web/src/lib/zama.ts`)
   - User provides plaintext signals: followers count, transaction count
   - Signals are normalized to tier (0-4: Diamond → Unranked)
   - Client encrypts using TFHE-rs WASM (CompactCiphertextList)
   - **ClientKey stays in browser** (localStorage, never shared)
   - Only encrypted ciphertext leaves the browser

2. **Encrypted Evaluation** (`apps/web/src/lib/fheCompute.ts`)
   - Relayer receives encrypted ciphertext (cannot see plaintext)
   - Evaluation: `encrypted_bracket <= TIER_THRESHOLD` (threshold comparison)
   - This happens on encrypted data — no decryption needed
   - Result: encrypted boolean (1 bit)

3. **User Decryption** (client-side)
   - User's ClientKey decrypts the result locally
   - Result: plaintext boolean (allowed/denied)
   - Smart contract uses boolean for threshold gating

### TFHE-rs Types

| Signal | Type | Range | Used For |
|--------|------|-------|----------|
| followers | euint16 | 0–65,535 | Normalized follower count (÷10) |
| txCount | euint32 | 0–4,294,967,295 | Normalized transaction count |
| bracket | euint8 | 0–4 | Tier classification |
| threshold | u8 | 2 | Allow Silver tier and above |

### Security Guarantees

- **Signals remain encrypted**: Relayer cannot see followers or txCount
- **Comparison is encrypted**: `bracket <= threshold` computed on ciphertext
- **Only result revealed**: Final boolean (allowed/denied) visible
- **ClientKey never leaves browser**: Only used for local decryption
- **Deterministic**: Same signals → same encrypted result → same plaintext boolean

### Relayer Model

Currently supports **Model 2: Relayer-Signed Evaluation**:

```typescript
// Client sends encrypted data
await relayerSDK.submitEncryptedInput({
  ciphertext: encryptedCiphertext,
  publicKey: tfhePublicKey
});

// Relayer evaluates on encrypted data
// Returns: { result: encryptedResult, signature: proof }

// User decrypts locally
const plaintext = clientKey.decrypt(encryptedResult);
```

### Computation Code

**Real FHE operations** are in:
- `apps/web/src/lib/fheCompute.ts:fheComputeScore()` — Main encrypted evaluation
- `apps/web/src/lib/fheCompute.ts:fheCompareBracketToThreshold()` — Encrypted comparison
- `apps/web/src/lib/fheCompute.ts:fheComputeAggregateScore()` — Encrypted arithmetic (sum + compare)

All use CompactCiphertext API from TFHE-rs for efficient encrypted operations.

## FHEVM Client Config

Check `apps/web/src/lib/fhevmConfig.ts` for Sepolia FHEVM parameters:

- **Relayer URL**: Zama's relayer endpoint
- **RPC URL**: Sepolia JSON-RPC
- **ACL/Verifier Addresses**: From Zama docs
- **Public Key Size**: 2048 bits

The `useFhevm()` hook (in `apps/web/src/lib/useFhevm.ts`) manages the FHEVM instance lifecycle and adapts to different SDK versions.

### Relayer SDK

The Zama relayer SDK is loaded via CDN in `apps/web/index.html`:

```html
<script src="https://cdn.zama.org/relayer-sdk/relayer-sdk.latest.js"></script>
```

Initialize it in `apps/web/src/lib/relayerInit.ts`:

```typescript
await initRelayerSDK();  // Initializes window.relayerSDK
```

## Data Flow

1. **User Input**: Twitter handle and blockchain wallet address
2. **Fetch Signals**: Backend queries Twitter API + RPC providers for follower count + transaction count
3. **Normalize**: Inputs converted to tier (Diamond/Gold/Silver/Bronze/Unranked) based on thresholds
4. **Encrypt (Client-side TFHE)**: 
   - Signals encrypted using TFHE-rs WASM
   - Ciphertext leaves browser; plaintext never leaves
   - ClientKey stored locally for decryption
5. **FHE Evaluation (Encrypted)**: 
   - Relayer receives encrypted ciphertext
   - Computes: `bracket <= TIER_THRESHOLD` on encrypted data
   - Returns encrypted result (1-bit boolean)
6. **Decrypt (Client-side)**: User's ClientKey decrypts result locally → plaintext boolean
7. **Submit**: Result (commitment + allowed gate) submitted to VeilScore contract
8. **Store**: Contract stores commitment and gate per user address; emits event

## Project Structure

```
.
├── contracts/
│   └── VeilScore.sol           # Main contract (commitment + gate storage)
├── scripts/
│   ├── deploy.ts                # Deploy to Sepolia
│   └── registerAcl.ts           # Register in ACL for relayer trust
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── components/InputForm.tsx   # Main UI form
│   │   │   ├── lib/
│   │   │   │   ├── zama.ts                # TFHE encryption pipeline
│   │   │   │   ├── fhevmConfig.ts         # Sepolia FHEVM config
│   │   │   │   ├── useFhevm.ts            # React hook for FHEVM instance
│   │   │   │   ├── relayerInit.ts         # Relayer SDK initialization
│   │   │   │   ├── contract.ts            # Contract interaction
│   │   │   │   └── signals.ts             # Types for signals
│   │   │   ├── abi/
│   │   │   │   └── VeilScore.json         # Contract ABI
│   │   │   └── index.css
│   │   └── index.html                     # Relayer SDK script here
│   └── server/
│       └── src/
│           ├── app.ts                     # Express app + signal endpoints
│           └── api/index.ts               # Vercel serverless API
├── docs/
│   └── ACL_REGISTRATION.md                # ACL registration guide
├── hardhat.config.ts
├── .env.example                           # Environment template
└── package.json
```

## Deploying on Vercel

Create two Vercel projects:

1. **Frontend** (`apps/web`): Set root to `apps/web`, framework = Vite
2. **Backend** (`apps/server`): Set root to `apps/server`, framework = Other (Node.js)

Update frontend's `VITE_API_BASE_URL` to the backend deployment URL before redeploying.

## Documentation

- **[ACL_REGISTRATION.md](docs/ACL_REGISTRATION.md)**: Relayer trust + ACL registration patterns
- **[.env.example](.env.example)**: All environment variables with descriptions
- **[copilot-instructions.md](.github/copilot-instructions.md)**: AI coding guidelines for this repo

## Troubleshooting

### "Cannot find VeilScore contract"

Ensure you've deployed the contract and set `VITE_VEILSCORE_ADDRESS` in `.env`.

### "Relayer rejected submission"

Check that VeilScore is registered in the ACL (`registerAcl.ts`). If not, run the registration script.

### "Zero signal values"

Ensure:
- `TWITTER_BEARER_TOKEN` is set and valid
- `ETHEREUM_RPC_URL` and other chain RPCs are valid
- Backend service is running (`pnpm server:dev`)

## References

- [Zama FHEVM Docs](https://docs.zama.ai/fhevm)
- [Zama Relayer SDK](https://docs.zama.ai/fhevm/guides/relayer)
- [Sepolia Faucet](https://www.infura.io/faucet/sepolia)
- [Infura](https://www.infura.io)
- [Alchemy](https://www.alchemy.com)
