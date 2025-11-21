# VeilScore Sepolia Deployment Checklist

## Pre-Deployment

- [ ] Node.js 18+ installed
- [ ] pnpm installed
- [ ] Infura or Alchemy account created
- [ ] Sepolia RPC endpoint from Infura/Alchemy
- [ ] Sepolia ETH in deployer account (≥0.1 ETH for gas)
- [ ] Twitter API bearer token (if using signal fetching)
- [ ] RPC URLs for Ethereum, Base, Arbitrum, Optimism (optional, for signal diversity)

## Environment Setup

- [ ] Copy `.env.example` to `.env`
- [ ] Fill in all required variables:
  - [ ] `DEPLOYER_PRIVATE_KEY` (funded account)
  - [ ] `SEPOLIA_RPC_URL` (from Infura/Alchemy)
  - [ ] `VITE_SEPOLIA_RPC_URL` (same as above)
  - [ ] `TWITTER_BEARER_TOKEN` (if using Twitter signal)
  - [ ] Other RPC URLs (optional)
- [ ] Verify no hardcoded values in `.env`
- [ ] Add `.env` to `.gitignore` (already done)

## Local Testing

- [ ] Run `pnpm install`
- [ ] Run `pnpm test` (all tests pass)
- [ ] Deploy to localhost: `npx hardhat run scripts/deploy.ts --network localhost`
- [ ] Start backend: `pnpm server:dev`
- [ ] Start frontend: `pnpm dev`
- [ ] Test UI locally at `http://localhost:5173`
- [ ] Verify "Fetch live signals" button works (if Twitter key is set)
- [ ] Verify "OnChain Imprints" button works (encrypts and encodes)

## Sepolia Deployment

### Deploy Contract

- [ ] Fund deployer account with Sepolia ETH
- [ ] Check balance: `cast balance <DEPLOYER_ADDRESS> --rpc-url $SEPOLIA_RPC_URL`
- [ ] Run deployment: `npx hardhat run scripts/deploy.ts --network sepolia`
- [ ] Copy contract address from output
- [ ] Update `.env`: `VITE_VEILSCORE_ADDRESS=0x<ADDRESS>`
- [ ] Verify contract exists: `cast call <ADDRESS> "admin()" --rpc-url $SEPOLIA_RPC_URL`

### Register in ACL

- [ ] Run registration: `npx hardhat run scripts/registerAcl.ts --network sepolia`
- [ ] Verify output shows "✅ Successfully registered in ACL!"
- [ ] Verify with cast:
  ```bash
  cast call 0x2aebcdc4ef0eb9b2dc5bb75060f7e3a4b5d5c5b0 \
    "isContractRegistered(address)(bool)" \
    <VEILSCORE_ADDRESS> \
    --rpc-url $SEPOLIA_RPC_URL
  ```
- [ ] Output should be `true`

### Test on Sepolia

- [ ] Update `.env` to point frontend to contract
- [ ] Start backend: `pnpm server:dev`
- [ ] Start frontend: `pnpm dev`
- [ ] Test full flow:
  - [ ] Enter Twitter handle (optional, for follower signal)
  - [ ] Enter wallet address
  - [ ] Click "Fetch live signals" (optional, to populate follower/tx counts)
  - [ ] Click "OnChain Imprints"
  - [ ] Verify transaction appears in Sepolia Etherscan
  - [ ] Check event emission in Etherscan
  - [ ] Query commitment from contract: `cast call <ADDRESS> "getEntry(<USER_ADDRESS>)" --rpc-url $SEPOLIA_RPC_URL`

## Production Deployment

### Vercel Frontend

- [ ] Create new Vercel project
- [ ] Set root directory to `apps/web`
- [ ] Set framework to "Vite"
- [ ] Add environment variables:
  - [ ] `VITE_VEILSCORE_ADDRESS=0x<ADDRESS>`
  - [ ] `VITE_API_BASE_URL=https://<BACKEND_URL>`
  - [ ] `VITE_SEPOLIA_RPC_URL=<RPC_URL>`
  - [ ] `VITE_ZAMA_RELAYER_KEY=<KEY>` (if required)
- [ ] Deploy
- [ ] Test frontend URL

### Vercel Backend

- [ ] Create new Vercel project
- [ ] Set root directory to `apps/server`
- [ ] Set framework to "Other > Node.js"
- [ ] Add environment variables:
  - [ ] `TWITTER_BEARER_TOKEN=<TOKEN>`
  - [ ] `ETHEREUM_RPC_URL=<URL>`
  - [ ] `BASE_RPC_URL=<URL>`
  - [ ] `ARBITRUM_RPC_URL=<URL>`
  - [ ] `OPTIMISM_RPC_URL=<URL>`
- [ ] Deploy
- [ ] Test backend API: `curl https://<BACKEND_URL>/api/signals?handle=<TWITTER_HANDLE>&address=<WALLET_ADDRESS>`
- [ ] Copy backend URL

### Finalize Frontend

- [ ] Update frontend `VITE_API_BASE_URL` to deployed backend URL
- [ ] Redeploy frontend
- [ ] Test full flow on Vercel URL

## Documentation

- [ ] README.md updated with deployment steps ✅
- [ ] ACL_REGISTRATION.md explains registration patterns ✅
- [ ] ACL_IMPLEMENTATION_SUMMARY.md provides implementation details ✅
- [ ] QUICK_START.md provides quick reference ✅
- [ ] .env.example documents all environment variables ✅
- [ ] Code comments added where needed ✅

## Monitoring & Verification

- [ ] Monitor Sepolia Etherscan for contract activity
- [ ] Check Vercel deployment logs for errors
- [ ] Monitor backend API performance
- [ ] Collect metrics on submission success rate
- [ ] Set up alerts for failed submissions (optional)

## Post-Deployment

- [ ] Create pull request from `fix/veilscore-security-events` to `main`
- [ ] Get code review
- [ ] Merge to main
- [ ] Tag release (e.g., `v1.0.0-sepolia`)
- [ ] Document any known issues or limitations

## Rollback Plan

If deployment fails:

- [ ] Revert frontend to previous Vercel deployment
- [ ] Revert backend to previous Vercel deployment
- [ ] Check Sepolia Etherscan for failed transactions
- [ ] Debug via hardhat test: `npx hardhat test`
- [ ] Re-run registration if needed

## Success Criteria

✅ Contract deployed to Sepolia  
✅ Contract registered in Zama ACL  
✅ Frontend connects to Sepolia  
✅ Backend fetches signals successfully  
✅ Users can submit encrypted data on-chain  
✅ Relayer accepts submissions (no errors)  
✅ Data stored in contract and queryable  
✅ Vercel frontend and backend both operational  
✅ Full end-to-end flow works on production URL  

## Useful Commands

```bash
# Check deployer balance
cast balance 0x<ADDRESS> --rpc-url $SEPOLIA_RPC_URL

# Query contract
cast call 0x<VEILSCORE> "admin()" --rpc-url $SEPOLIA_RPC_URL

# Verify registration
cast call 0x2aebcdc4ef0eb9b2dc5bb75060f7e3a4b5d5c5b0 \
  "isContractRegistered(address)(bool)" \
  0x<VEILSCORE> \
  --rpc-url $SEPOLIA_RPC_URL

# View contract on Etherscan
https://sepolia.etherscan.io/address/0x<VEILSCORE>

# View transaction
https://sepolia.etherscan.io/tx/0x<TX_HASH>
```

## References

- [README.md](../README.md) - Main documentation
- [ACL_REGISTRATION.md](./ACL_REGISTRATION.md) - Registration guide
- [QUICK_START.md](./QUICK_START.md) - Quick reference
- [Sepolia Etherscan](https://sepolia.etherscan.io/)
- [Infura Faucet](https://www.infura.io/faucet/sepolia)
- [Zama FHEVM Docs](https://docs.zama.ai/fhevm)
