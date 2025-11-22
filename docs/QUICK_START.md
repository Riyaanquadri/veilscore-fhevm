# Quick Start: Deploy VeilScore to Sepolia

## Local Development Prerequisites ✓

- Node.js 18+, pnpm installed
- (Optional) Funded Sepolia account for testnet deployment
- `.env` file with required variables (see `.env.example`)

## Running Locally (5 minutes)

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env and update:
# VITE_VEILSCORE_ADDRESS=0x...        # Will get from deployment
# VITE_API_BASE_URL=http://localhost:4000
# TWITTER_BEARER_TOKEN=...             # For signal fetching
```

## Start Local Stack

### Terminal 1: Hardhat Node
```bash
npx hardhat node
```

### Terminal 2: Deploy Contract
```bash
npx hardhat run scripts/deploy.ts --network localhost
# Copy the deployed address and update .env
```

### Terminal 3: Backend
```bash
pnpm server:dev
# Runs on http://localhost:4000
```

### Terminal 4: Frontend
```bash
pnpm dev
# Runs on http://localhost:5173
# Check browser console for initialization logs
```

## Troubleshooting SDK Initialization

### ⚠️ Error: TFHE WASM Initialization Failed

**What was fixed**: 
- TFHE package uses `initSDK({})` not `init()`
- Proper error handling with diagnostic logging

**If you still see errors**:

1. **Clear cache and reinstall**:
   ```bash
   cd apps/web
   rm -rf node_modules package-lock.yaml pnpm-lock.yaml
   pnpm install
   ```

2. **Hard refresh browser**:
   - macOS: Cmd+Shift+Delete
   - Windows/Linux: Ctrl+Shift+Delete

3. **Check browser console** for messages like:
   ```
   [TFHE] ✅ TFHE WASM module successfully initialized
   ```

### ⚠️ Error: Relayer SDK Not Found

**Fix**: Ensure `index.html` includes CDN script
```html
<script src="https://cdn.zama.org/relayer-sdk/relayer-sdk.latest.js"></script>
```

### ⚠️ Error: Cannot Find VeilScore Contract

**Fix**: Update `.env` with deployed address
```bash
VITE_VEILSCORE_ADDRESS=0x<address_from_terminal_2>
```

## Deploy to Sepolia (Optional)

Prerequisites ✓

- [ ] Infura/Alchemy account with Sepolia RPC endpoint
- [ ] Funded Sepolia account (get ETH from [faucet](https://www.infura.io/faucet/sepolia))
- [ ] Private key in `.env` as `DEPLOYER_PRIVATE_KEY`

### Deploy Steps
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
