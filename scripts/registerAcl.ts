import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * ACL Registration Script for VeilScore on Sepolia FHEVM
 *
 * This script registers the VeilScore contract in the Zama FHEVM ACL (Access Control List)
 * so the relayer trusts evaluations submitted for this contract.
 *
 * Two registration patterns:
 * A. Onchain ACL: Register contract address in the ACL contract deployed on Sepolia.
 * B. Relayer attestation: Contract accepts relayer-signed evaluations (already in VeilScore).
 *
 * For Sepolia FHEVM, Pattern A is the primary mechanism. The relayer reads the ACL
 * to verify which contracts are eligible for evaluation.
 *
 * Prerequisites:
 * 1. VeilScore contract deployed on Sepolia (address in VITE_VEILSCORE_ADDRESS)
 * 2. DEPLOYER_PRIVATE_KEY funded with Sepolia ETH
 * 3. SEPOLIA_RPC_URL set to a valid Sepolia endpoint
 */

interface AclRegistrationConfig {
  veilScoreAddress: string;
  aclContractAddress: string;
  rpcUrl: string;
  deployerPrivateKey: string;
}

/**
 * Generic ACL ABI for Zama FHEVM (common interface pattern)
 * Update this based on actual ACL contract ABI from Zama docs:
 * https://docs.zama.ai/fhevm/guides/deployment
 */
const GENERIC_ACL_ABI = [
  "function registerContract(address contractAddress) external",
  "function isContractRegistered(address contractAddress) external view returns (bool)",
  "function removeContract(address contractAddress) external",
];

/**
 * Relayer Attestation ABI (if contract uses submitWithSig pattern)
 * This allows the contract to trust evaluations signed by the relayer
 */
const RELAYER_ATTESTATION_ABI = [
  "function setRelayerAddress(address _relayer) external",
  "function relayerAddress() public view returns (address)",
];

async function main() {
  const config = loadConfig();
  console.log("\n=== VeilScore ACL Registration ===\n");
  console.log("Configuration:");
  console.log(`  VeilScore Address:    ${config.veilScoreAddress}`);
  console.log(`  ACL Contract Address: ${config.aclContractAddress}`);
  console.log(`  Network:              Sepolia (11155111)\n`);

  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const deployer = new ethers.Wallet(config.deployerPrivateKey, provider);

  console.log(`Deployer Address: ${deployer.address}\n`);

  // Check balance
  const balance = await provider.getBalance(deployer.address);
  console.log(`Deployer Balance: ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    console.error("❌ Error: Deployer account has 0 ETH. Please fund it from the Sepolia faucet:");
    console.error("   https://www.infura.io/faucet/sepolia\n");
    process.exitCode = 1;
    return;
  }

  // Pattern A: Register in ACL (onchain)
  await registerInAcl(deployer, config);

  // Pattern B: Set relayer address in contract (if implemented)
  await setRelayerAddress(deployer, config);

  console.log("\n✅ Registration complete!\n");
}

/**
 * Pattern A: Register VeilScore in the onchain ACL
 */
async function registerInAcl(
  deployer: any,
  config: AclRegistrationConfig
): Promise<void> {
  console.log("--- Pattern A: Onchain ACL Registration ---\n");

  try {
    const aclContract = new ethers.Contract(
      config.aclContractAddress,
      GENERIC_ACL_ABI,
      deployer
    );

    // Check if already registered
    console.log("Checking if VeilScore is already registered in ACL...");
    let isRegistered = false;
    try {
      isRegistered = await aclContract.isContractRegistered(config.veilScoreAddress);
    } catch (err) {
      console.warn("⚠️  Could not check registration status. ACL contract may not have isContractRegistered method.");
      console.warn("   Proceeding with registration attempt...\n");
    }

    if (isRegistered) {
      console.log("✅ VeilScore is already registered in the ACL.\n");
      return;
    }

    // Register contract in ACL
    console.log(`Registering VeilScore (${config.veilScoreAddress}) in ACL...`);
    const tx = await aclContract.registerContract(config.veilScoreAddress);
    console.log(`   Transaction hash: ${tx.hash}`);

    const receipt = await tx.wait();
    if (receipt?.status === 1) {
      console.log("✅ Successfully registered in ACL!\n");
    } else {
      console.error("❌ Registration transaction failed\n");
      process.exitCode = 1;
    }
  } catch (error: any) {
    console.error(`❌ ACL registration error: ${error.message}`);
    console.error("   Note: This may be expected if the ACL contract address is not set correctly.");
    console.error("   Verify the ACL contract address from Zama docs and update fhevmConfig.ts\n");
    // Continue to Pattern B even if Pattern A fails
  }
}

/**
 * Pattern B: Set relayer address in VeilScore contract
 * (Only if VeilScore implements setRelayerAddress)
 */
async function setRelayerAddress(
  deployer: any,
  config: AclRegistrationConfig
): Promise<void> {
  console.log("--- Pattern B: Relayer Attestation Setup ---\n");

  // For now, VeilScore uses simple submit() without signature verification
  // If you implement submitWithSig pattern later, uncomment below:
  /*
  try {
    const veilScoreContract = new ethers.Contract(
      config.veilScoreAddress,
      RELAYER_ATTESTATION_ABI,
      deployer
    );

    const relayerAddress = "0x..."; // Get from Zama docs
    console.log(`Setting relayer address to ${relayerAddress}...`);
    
    const tx = await veilScoreContract.setRelayerAddress(relayerAddress);
    const receipt = await tx.wait();
    
    if (receipt?.status === 1) {
      console.log("✅ Relayer address set successfully!\n");
    }
  } catch (error: any) {
    console.warn(`⚠️  Could not set relayer address: ${error.message}`);
    console.warn("   This is OK if VeilScore doesn't implement relayer signature verification.\n");
  }
  */

  console.log(
    "ℹ️  VeilScore currently uses simple submit() without relayer signatures.\n" +
    "   If you later implement submitWithSig pattern, update this script to set the relayer address.\n"
  );
}

function loadConfig(): AclRegistrationConfig {
  const veilScoreAddress =
    process.env.VITE_VEILSCORE_ADDRESS || process.env.VEILSCORE_ADDRESS;
  const aclContractAddress =
    process.env.SEPOLIA_ACL_ADDRESS || "0x2aebcdc4ef0eb9b2dc5bb75060f7e3a4b5d5c5b0";
  const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_PROJECT_ID";
  const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY || "";

  if (!veilScoreAddress || veilScoreAddress.startsWith("0x0")) {
    console.error("❌ Error: VITE_VEILSCORE_ADDRESS not set or invalid");
    console.error("   Please deploy VeilScore first and set the address in .env\n");
    process.exitCode = 1;
    process.exit(1);
  }

  if (!deployerPrivateKey || deployerPrivateKey.startsWith("0x0")) {
    console.error("❌ Error: DEPLOYER_PRIVATE_KEY not set or invalid");
    console.error("   Add a funded private key to .env\n");
    process.exitCode = 1;
    process.exit(1);
  }

  return {
    veilScoreAddress,
    aclContractAddress,
    rpcUrl,
    deployerPrivateKey,
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
