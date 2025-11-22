/**
 * FHEVM Network Configuration
 * 
 * Extracted from Relayer SDK (https://github.com/zama-ai/relayer-sdk)
 * Source: https://github.com/zama-ai/relayer-sdk/blob/main/src/index.ts (SepoliaConfig)
 * 
 * These are the official Zama-provided contract addresses and network parameters
 * for Sepolia testnet integration.
 */

/**
 * SEPOLIA TESTNET CONFIGURATION
 * 
 * Official Zama deployment addresses for Ethereum Sepolia (chain ID 11155111)
 * Used for FHEVM smart contract interaction and gateway operations
 * 
 * Gateway Chain: Zama Gateway (chain ID 10901)
 * Relayer: https://relayer.testnet.zama.org
 * RPC: https://ethereum-sepolia-rpc.publicnode.com
 */
export const ZAMA_SEPOLIA_CONFIG = {
  // FHEVM Host Chain (Ethereum Sepolia)
  chainId: 11155111,
  network: 'https://ethereum-sepolia-rpc.publicnode.com',
  
  // Gateway Chain (Zama Gateway)
  gatewayChainId: 10901,
  
  // Relayer Service
  relayerUrl: 'https://relayer.testnet.zama.org',
  
  // ACL Contract (Access Control List)
  // Purpose: Manages which contracts are authorized for FHE operations
  // See: https://docs.zama.org/fhevm/guides/access-control
  aclContractAddress: '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D',
  
  // KMS Verifier Contract (Key Management System)
  // Purpose: Manages encryption keys and key verification
  kmsContractAddress: '0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A',
  
  // Input Verifier Contract (FHEVM Host Chain)
  // Purpose: Verifies encrypted inputs before FHE computation
  inputVerifierContractAddress: '0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0',
  
  // Decryption Verifier (Gateway Chain)
  // Purpose: Verifies decryption operations on gateway
  verifyingContractAddressDecryption: '0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478',
  
  // Input Verification Contract (Gateway Chain)
  // Purpose: Verifies encrypted inputs on gateway
  verifyingContractAddressInputVerification: '0x483b9dE06E4E4C7D35CCf5837A1668487406D955',
} as const;

/**
 * Export as FhevmInstanceConfig-compatible object
 * For use with Relayer SDK's createInstance()
 * 
 * Usage:
 *   const instance = await createInstance(FHEVM_INSTANCE_CONFIG);
 */
export const FHEVM_INSTANCE_CONFIG = {
  ...ZAMA_SEPOLIA_CONFIG,
  // Note: publicKey and publicParams are fetched from relayer if relayerUrl is provided
} as const;

/**
 * Quick reference for contract addresses
 * 
 * VeilScore uses:
 * - aclContractAddress: For ACL registration (in registerAcl.ts)
 * - kmsContractAddress: For key verification
 * - inputVerifierContractAddress: For input proof verification
 * - relayerUrl: For encryption key distribution and proof generation
 */
export const ZAMA_CONTRACT_ADDRESSES = {
  acl: ZAMA_SEPOLIA_CONFIG.aclContractAddress,
  kmsVerifier: ZAMA_SEPOLIA_CONFIG.kmsContractAddress,
  inputVerifier: ZAMA_SEPOLIA_CONFIG.inputVerifierContractAddress,
  decryptionVerifier: ZAMA_SEPOLIA_CONFIG.verifyingContractAddressDecryption,
  inputVerificationGateway: ZAMA_SEPOLIA_CONFIG.verifyingContractAddressInputVerification,
} as const;

/**
 * Network RPC endpoints
 * 
 * Fallbacks provided in case primary RPC is unavailable
 */
export const SEPOLIA_RPC_URLS = [
  ZAMA_SEPOLIA_CONFIG.network, // Official Zama recommendation
  'https://eth-sepolia.blastapi.io', // Blast API (from relayer-sdk/bin/relayer.js)
  'https://sepolia.infura.io/v3/YOUR_INFURA_KEY', // Infura (requires key)
  'https://ethereum-sepolia-rpc.blockpi.io/v1/rpc/public', // BlockPI
] as const;

/**
 * Relayer Service Configuration
 * 
 * The relayer is a Zama-provided service that:
 * 1. Generates encryption keys
 * 2. Proves input verifications
 * 3. Decrypts results (optional, for Model 2)
 * 
 * Documentation: https://docs.zama.org/guides/relayer-sdk
 * GitHub: https://github.com/zama-ai/relayer-sdk
 */
export const RELAYER_CONFIG = {
  url: ZAMA_SEPOLIA_CONFIG.relayerUrl,
  version: 'v1', // API version
  endpoints: {
    getKeys: 'v1/keys', // GET keys for encryption
    submitEncryption: 'v1/input-proof', // POST encrypted input for proof
    evaluateFunc: 'v1/evaluate', // POST for FHE computation (if available)    
  },
} as const;

/**
 * Type definitions for configuration usage
 */
export type SepoliaConfig = typeof ZAMA_SEPOLIA_CONFIG;
export type RelayerEndpoint = keyof typeof RELAYER_CONFIG.endpoints;

/**
 * Helper function to get full relayer endpoint URL
 * 
 * @param endpoint The endpoint name (e.g., 'submitEncryption')
 * @returns Full URL including protocol and endpoint
 */
export function getRelayerEndpoint(endpoint: RelayerEndpoint): string {
  const baseUrl = RELAYER_CONFIG.url.replace(/\/$/, ''); // Remove trailing slash
  const path = RELAYER_CONFIG.endpoints[endpoint];
  return `${baseUrl}/${path}`;
}

/**
 * Validation helpers
 */
export function validateZamaConfig(config: Partial<typeof ZAMA_SEPOLIA_CONFIG>): boolean {
  const required = [
    'aclContractAddress',
    'kmsContractAddress',
    'inputVerifierContractAddress',
    'verifyingContractAddressDecryption',
    'verifyingContractAddressInputVerification',
    'chainId',
    'gatewayChainId',
    'relayerUrl',
    'network',
  ] as const;
  
  return required.every((field) => config[field] !== undefined);
}

/**
 * Export Sepolia config as default for quick imports
 */
export default ZAMA_SEPOLIA_CONFIG;
