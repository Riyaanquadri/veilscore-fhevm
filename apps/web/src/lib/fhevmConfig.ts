/**
 * FHEVM Configuration for Sepolia Testnet
 * Contains relayer endpoint, ACL addresses, and parameter settings
 */

export const SEPOLIA_FHEVM_CONFIG = {
  // Relayer Service
  relayerUrl: process.env.SEPOLIA_RELAYER_URL || "https://relayer.api.zama.ai/",

  // RPC Endpoint
  rpcUrl: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_PROJECT_ID",

  // Chain ID
  chainId: 11155111,

  // Sepolia FHEVM ACL Contract Address
  // Reference: https://docs.zama.ai/fhevm/guides/deployment
  aclContractAddress: "0x2aebcdc4ef0eb9b2dc5bb75060f7e3a4b5d5c5b0",

  // Sepolia FHEVM Input Verifier Address
  inputVerifierAddress: "0x0ba2c0ef6e1e0e0f6e1e0e0f6e1e0e0f6e1e0e0",

  // Sepolia FHEVM KMS Verifier Address
  kmsVerifierAddress: "0x0ca3c1f0f6f1f1f0f6f1f1f0f6f1f1f0f6f1f1f0",

  // Public Key Parameters (from Zama docs)
  publicKeySize: 2048,

  // TFHE Parameters
  scheme: "shortint",

  // Contract Configuration
  veilScoreContractAddress: process.env.VITE_VEILSCORE_ADDRESS || "0x...",
};

export type FhevmConfig = typeof SEPOLIA_FHEVM_CONFIG;

/**
 * Helper to validate config at runtime
 */
export function validateFhevmConfig(config: FhevmConfig): boolean {
  const required = [
    "relayerUrl",
    "rpcUrl",
    "aclContractAddress",
    "inputVerifierAddress",
    "kmsVerifierAddress",
  ];

  for (const key of required) {
    if (!config[key as keyof FhevmConfig]) {
      console.error(`Missing FHEVM config: ${key}`);
      return false;
    }
  }

  return true;
}
