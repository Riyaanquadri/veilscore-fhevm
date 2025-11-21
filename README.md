# VeilScore — FHEVM dApp Demo

Private Reputation Oracle (VeilScore) — client-side encrypted signals computed via FHEVM to produce a single private score and threshold gating on-chain. Designed to match Zama Developer Program Builder Track criteria.

## Architecture

- **Contracts**: `contracts/VeilScore.sol` stores a commitment (bytes32) and a boolean `allowed` flag per address. All heavy FHE computation happens off-chain.
- **Frontend**: `apps/web` is a Vite + React + TypeScript app that collects user inputs, calls placeholder Zama TFHE helpers in `src/lib/zama.ts`, and submits results to the contract via `src/lib/contract.ts`.
- **Worker**: `worker/compute.js` simulates an FHE compute service; replace its internals with calls to Zama's FHE runtime.

## Getting Started

Install dependencies (root + frontend + server) with pnpm:

```bash
pnpm install
pnpm -C apps/web install
pnpm -C apps/server install
```

Run Hardhat tests:

```bash
pnpm test
```

Start a local Hardhat node and deploy the contract:

```bash
npx hardhat node
pnpm hardhat:deploy --network localhost
```

Copy the deployed address into `apps/web/.env` as `VITE_VEILSCORE_ADDRESS` and point the frontend to the signal API (defaults shown below).

Start the frontend:

```bash
pnpm dev
```

This will launch the VeilScore demo UI, which simulates client-side encryption + FHE compute and writes a commitment + boolean gate on-chain.

## Signal Fetch Service

`apps/server` hosts a lightweight Express service that pulls public metrics so the UI can prefill follower counts and transaction statistics.

### Environment variables

Create a `.env` file at the repo root (loaded by both Hardhat and the server):

```
TWITTER_BEARER_TOKEN=your-twitter-bearer-token
ETHERSCAN_API_KEY=your-etherscan-api-key
BASESCAN_API_KEY=optional-basescan-key (falls back to ETHERSCAN_API_KEY)
ARBISCAN_API_KEY=optional-arbiscan-key (falls back to ETHERSCAN_API_KEY)
OPTIMISM_API_KEY=optional-optimism-etherscan-key (falls back to ETHERSCAN_API_KEY)
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/... (or Alchemy, etc.)
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/...
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC_URL=https://mainnet.optimism.io
```

Basescan/Arbiscan/Optimism keys fall back to the main `ETHERSCAN_API_KEY`, but providing dedicated keys helps avoid rate limits for first-transaction lookups and ETH inflow tallies.

For the frontend, add these to `apps/web/.env`:

```
VITE_VEILSCORE_ADDRESS=0x...
VITE_API_BASE_URL=http://localhost:4000
```

### Run the service

```bash
pnpm server:dev
```

Then start the frontend (`pnpm dev`) and use the “Fetch live signals” button to automatically populate follower count (from Twitter), cumulative tx count, per-chain first transaction timestamps, and ETH inflow totals (Ethereum + Base + Arbitrum + Optimism).
