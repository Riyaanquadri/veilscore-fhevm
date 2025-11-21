# VeilScore — FHEVM dApp Demo

Private Reputation Oracle (VeilScore) — client-side encrypted signals computed via FHEVM to produce a single private score and threshold gating on-chain. 

## Architecture

- **Contracts**: `contracts/VeilScore.sol` stores a commitment (bytes32) and a boolean `allowed` flag per address. All heavy FHE computation happens off-chain.
- **Frontend**: `apps/web` is a Vite + React + TypeScript app that collects user inputs, calls Zama TFHE helpers in `src/lib/zama.ts`, and submits results to the contract via `src/lib/contract.ts`.
- **Backend**: `apps/server` is an Express service that fetches public signals (Twitter followers, on-chain transaction counts) for prefilling user inputs.
- **FHEVM Integration**: Uses Zama's relayer SDK (loaded via CDN) + adaptive config detection (`useFhevm.ts` hook) to encrypt inputs and evaluate inside Sepolia FHEVM.

## Getting Started

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

4. **Start local Hardhat node and services**:

```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy to localhost
npx hardhat run scripts/deploy.ts --network localhost

# Terminal 3: Start backend signal service
pnpm server:dev

# Terminal 4: Start frontend
pnpm dev
```

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

### FHEVM Client Config

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
4. **Encrypt**: Tier + commitment encrypted via Zama TFHE SDK
5. **Evaluate**: Relayer evaluates encrypted data; checks tier threshold
6. **Submit**: Result (commitment + allowed gate) submitted to VeilScore contract
7. **Store**: Contract stores commitment and gate per user address; emits event

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
