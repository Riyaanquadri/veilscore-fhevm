# ACL & Input Verifier Registration

This guide explains how to register your VeilScore contract with the Zama FHEVM relayer so it trusts evaluations and submissions from your contract.

## Overview

There are two trust patterns in Zama FHEVM:

### Pattern A: Onchain ACL (Primary)
- Your contract address is registered in an **Access Control List (ACL)** contract deployed on Sepolia.
- The relayer reads this ACL to verify which contracts are eligible for FHE evaluation.
- If your contract is in the ACL, the relayer accepts submissions from it.
- **Use this for:** Production contracts that need relayer trust.

### Pattern B: Relayer Signature Verification (Advanced)
- Your contract expects evaluations to be **signed by the relayer**.
- You implement a `submitWithSig(bytes calldata input, bytes calldata signature)` function.
- The contract verifies the relayer's signature before accepting data.
- **Use this for:** Additional security or when you want fine-grained control over which evaluations to accept.

## Current VeilScore Implementation

VeilScore currently uses a simple `submit(bytes32 commitment, bool allowed)` function (Pattern A approach).

- ✅ No signature verification needed (simpler contract).
- ✅ Relayer only needs to ensure contract is in ACL.
- ⚠️ **Must register in ACL** for relayer to trust your contract.

## Registration Steps

### 1. Deploy VeilScore to Sepolia

```bash
# Set environment variables in .env
export DEPLOYER_PRIVATE_KEY=<your_funded_private_key>
export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<YOUR_PROJECT_ID>

# Deploy contract
npx hardhat run scripts/deploy.ts --network sepolia
```

After deployment, the contract address will be printed. Update `.env`:

```bash
VITE_VEILSCORE_ADDRESS=0x<contract_address_from_deploy>
```

### 2. Find the Sepolia ACL Contract Address

Check [Zama FHEVM docs](https://docs.zama.ai/fhevm/guides/deployment) for the **official Sepolia ACL contract address**.

Common location: `fhevmConfig.ts` has a placeholder.

Update `.env` if needed:

```bash
SEPOLIA_ACL_ADDRESS=0x<acl_contract_address_from_zama_docs>
```

### 3. Register in ACL

Run the registration script:

```bash
npx hardhat run scripts/registerAcl.ts --network sepolia
```

**What it does:**
- Checks if VeilScore is already registered in the ACL.
- If not, submits a registration transaction.
- Verifies the registration succeeded.

**Output:**
```
=== VeilScore ACL Registration ===

Configuration:
  VeilScore Address:    0xYourContractAddress
  ACL Contract Address: 0xZamaAclContractAddress
  Network:              Sepolia (11155111)

Deployer Address: 0xYourDeployerAddress
Deployer Balance: 0.5 ETH

--- Pattern A: Onchain ACL Registration ---
Registering VeilScore (0xYourContractAddress) in ACL...
   Transaction hash: 0xTxHash
✅ Successfully registered in ACL!

✅ Registration complete!
```

### 4. Verify Registration

Query the ACL to confirm:

```bash
# Check if VeilScore is registered
cast call <ACL_ADDRESS> "isContractRegistered(address)(bool)" <VEILSCORE_ADDRESS> \
  --rpc-url $SEPOLIA_RPC_URL
```

Expected output: `true`

## Environment Variables

Add these to `.env`:

```bash
# Sepolia deployment
DEPLOYER_PRIVATE_KEY=<your_funded_private_key>
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<YOUR_INFURA_PROJECT_ID>

# ACL registration
SEPOLIA_ACL_ADDRESS=0x<official_acl_contract_from_zama_docs>
VITE_VEILSCORE_ADDRESS=0x<deployed_contract_address>
```

## Troubleshooting

### "Deployer account has 0 ETH"
- Fund your account from [Sepolia Faucet](https://www.infura.io/faucet/sepolia)
- Wait 1-2 minutes for funds to arrive

### "Could not check registration status"
- The ACL ABI may differ from `GENERIC_ACL_ABI` in the script
- Check [Zama docs](https://docs.zama.ai/fhevm/guides/deployment) for the actual ACL interface
- Update `GENERIC_ACL_ABI` in `scripts/registerAcl.ts` accordingly

### "Registration transaction failed"
- Verify `SEPOLIA_ACL_ADDRESS` is correct
- Check your deployer has enough ETH for gas
- Ensure the ACL contract is deployed at that address

## What Happens After Registration

1. **Relayer trusts your contract**: The Zama relayer now recognizes VeilScore as eligible.
2. **Submissions accepted**: When your frontend calls the relayer with encrypted data for VeilScore, the relayer accepts it.
3. **FHE evaluation**: The relayer evaluates the encrypted computation inside FHEVM.
4. **Results submitted**: Encrypted results are sent back to your contract via `submit()`.

## Next Steps: InputForm Integration

Once VeilScore is deployed and registered:

1. Update `apps/web/src/components/InputForm.tsx` to use the real FHEVM instance via `useFhevm()` hook.
2. Replace mock `encryptWithTFHE()` with actual `instance.encrypt*()` calls.
3. Replace mock `callFHECompute()` with relayer SDK evaluation.
4. Test the full end-to-end flow.

See `INTEGRATION.md` for details.

## References

- [Zama FHEVM Deployment Guide](https://docs.zama.ai/fhevm/guides/deployment)
- [Zama FHEVM ACL Documentation](https://docs.zama.ai/fhevm/guides/acl)
- [Sepolia Faucet](https://www.infura.io/faucet/sepolia)
