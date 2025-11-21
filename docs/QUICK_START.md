# Quick Start: Deploy VeilScore to Sepolia

## Prerequisites ✓

- [ ] Node.js 18+, pnpm installed
- [ ] Infura/Alchemy account with Sepolia RPC endpoint
- [ ] Funded Sepolia account (get ETH from [faucet](https://www.infura.io/faucet/sepolia))
- [ ] `.env` file with required variables (see `.env.example`)

## 1-Minute Setup

```bash
# Copy template
cp .env.example .env

# Edit .env and add:
# DEPLOYER_PRIVATE_KEY=0x...
# SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/...
# TWITTER_BEARER_TOKEN=...
```

## Deploy (5 minutes)

```bash
# Install
pnpm install

# Deploy contract
npx hardhat run scripts/deploy.ts --network sepolia

# Save the contract address, then update .env:
# VITE_VEILSCORE_ADDRESS=0x<from_deploy_output>
```

## Register (2 minutes)

```bash
# Register in Zama ACL
npx hardhat run scripts/registerAcl.ts --network sepolia

# Verify (should output true)
cast call 0x2aebcdc4ef0eb9b2dc5bb75060f7e3a4b5d5c5b0 \
  "isContractRegistered(address)(bool)" \
  0x<VEILSCORE_ADDRESS> \
  --rpc-url $SEPOLIA_RPC_URL
```

## Test Locally

```bash
# Terminal 1: Hardhat node
npx hardhat node

# Terminal 2: Deploy to localhost
npx hardhat run scripts/deploy.ts --network localhost

# Terminal 3: Backend signals
pnpm server:dev

# Terminal 4: Frontend
pnpm dev

# Visit http://localhost:5173
```

## Deploy to Production

```bash
# Create two Vercel projects:
# 1. Frontend: apps/web (Framework: Vite)
# 2. Backend: apps/server (Framework: Other > Node.js)

# Update .env with backend URL:
VITE_API_BASE_URL=https://your-backend.vercel.app

# Redeploy frontend
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Deployer has 0 ETH" | Fund account at [Infura Faucet](https://www.infura.io/faucet/sepolia) |
| "Cannot connect to Sepolia" | Check SEPOLIA_RPC_URL is valid Infura/Alchemy URL |
| "VeilScore not found" | Ensure deployed address is in VITE_VEILSCORE_ADDRESS |
| "Relayer rejected" | Run registration script again, verify with cast |
| "Signal values are 0" | Check TWITTER_BEARER_TOKEN and RPC URLs are valid |

## Commands Reference

```bash
# Deploy
npx hardhat run scripts/deploy.ts --network sepolia

# Register
npx hardhat run scripts/registerAcl.ts --network sepolia

# Run tests
pnpm test

# Start services
pnpm dev              # Frontend
pnpm server:dev       # Backend
npx hardhat node      # Local blockchain

# Clean
pnpm hardhat clean
rm -rf artifacts cache typechain-types
```

## Key Files

- `contracts/VeilScore.sol` - Main contract
- `scripts/deploy.ts` - Deployment script
- `scripts/registerAcl.ts` - ACL registration
- `apps/web/src/components/InputForm.tsx` - UI
- `.env.example` - Environment template
- `docs/ACL_REGISTRATION.md` - Full guide

## What Happens Next

✅ Contract deployed to Sepolia  
✅ Registered in Zama ACL  
✅ Frontend can submit encrypted data  
✅ Relayer evaluates inside FHEVM  
✅ Results stored on-chain  

See [ACL_REGISTRATION.md](ACL_REGISTRATION.md) for detailed flow.

---

**Need help?** Check the [README.md](../README.md) for complete documentation.
