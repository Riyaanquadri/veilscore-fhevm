/**
 * relayerSDKDiagnostics.ts
 * 
 * Diagnostic utility to inspect Relayer SDK configuration after initialization
 * 
 * SDKs commonly expose network defaults:
 * - relayerUrl
 * - aclAddress
 * - gatewayUrl
 * - programIds
 * - chainIds
 * - contractAddresses
 * 
 * This utility helps verify what the SDK exposes vs what we extract manually
 * 
 * Usage:
 *   const config = await inspectRelayerSDKConfig();
 *   console.log(config);
 *   console.log(config.aclAddress);    // Look for ACL address
 *   console.log(config.relayerUrl);    // Look for relayer endpoint
 */

export interface SDKConfigSnapshot {
  // General info
  sdkVersion?: string;
  environment?: string;
  initialized?: boolean;
  
  // Network config
  chainId?: number | string;
  gatewayChainId?: number | string;
  networkName?: string;
  
  // Addresses
  aclAddress?: string;
  aclContractAddress?: string;
  kmsAddress?: string;
  kmsContractAddress?: string;
  inputVerifierAddress?: string;
  inputVerifierContractAddress?: string;
  decryptionVerifierAddress?: string;
  verifyingContractAddressDecryption?: string;
  inputVerificationGatewayAddress?: string;
  verifyingContractAddressInputVerification?: string;
  
  // URLs
  relayerUrl?: string;
  relayerEndpoint?: string;
  relayerAddress?: string;
  rpcUrl?: string;
  rpcEndpoint?: string;
  gatewayUrl?: string;
  gatewayEndpoint?: string;
  
  // Program IDs (Solana-style)
  programIds?: Record<string, string>;
  
  // Other config
  publicKey?: any;
  publicParams?: any;
  keys?: Record<string, any>;
  config?: Record<string, any>;
  
  // Raw SDK object properties (all enumerable keys)
  allProperties?: Record<string, any>;
}

/**
 * Deep inspect all properties of the Relayer SDK
 * Returns a snapshot of all configuration values
 */
export async function inspectRelayerSDKConfig(): Promise<SDKConfigSnapshot> {
  if (typeof window === "undefined") {
    throw new Error("Browser window not available");
  }

  if (!window.relayerSDK) {
    throw new Error("Relayer SDK not loaded. Ensure CDN script is in index.html");
  }

  const sdk = window.relayerSDK;
  const snapshot: SDKConfigSnapshot = {};

  // Try to extract version
  if (sdk.version) {
    snapshot.sdkVersion = sdk.version;
  } else if (sdk.VERSION) {
    snapshot.sdkVersion = sdk.VERSION;
  }

  // Check initialization state
  snapshot.initialized = sdk.__initialized__ || sdk.initialized || false;

  // Environment/Config (common patterns)
  if (sdk.env) snapshot.environment = sdk.env;
  if (sdk.environment) snapshot.environment = sdk.environment;
  if (sdk.config?.env) snapshot.environment = sdk.config.env;

  // Network config
  if (sdk.chainId) snapshot.chainId = sdk.chainId;
  if (sdk.config?.chainId) snapshot.chainId = sdk.config.chainId;
  if (sdk.CHAIN_ID) snapshot.chainId = sdk.CHAIN_ID;

  if (sdk.gatewayChainId) snapshot.gatewayChainId = sdk.gatewayChainId;
  if (sdk.config?.gatewayChainId) snapshot.gatewayChainId = sdk.config.gatewayChainId;
  if (sdk.GATEWAY_CHAIN_ID) snapshot.gatewayChainId = sdk.GATEWAY_CHAIN_ID;

  if (sdk.networkName) snapshot.networkName = sdk.networkName;
  if (sdk.config?.networkName) snapshot.networkName = sdk.config.networkName;

  // ACL addresses (common naming patterns)
  const aclPatterns = [
    "aclAddress",
    "aclContractAddress",
    "ACL_ADDRESS",
    "ACL",
    "acl",
  ];
  for (const pattern of aclPatterns) {
    if (sdk[pattern]) {
      snapshot.aclAddress = sdk[pattern];
      snapshot.aclContractAddress = sdk[pattern];
      break;
    }
    if (sdk.config?.[pattern]) {
      snapshot.aclAddress = sdk.config[pattern];
      snapshot.aclContractAddress = sdk.config[pattern];
      break;
    }
  }

  // KMS addresses
  const kmsPatterns = [
    "kmsAddress",
    "kmsContractAddress",
    "KMS_ADDRESS",
    "kmsVerifier",
    "kms",
  ];
  for (const pattern of kmsPatterns) {
    if (sdk[pattern]) {
      snapshot.kmsAddress = sdk[pattern];
      snapshot.kmsContractAddress = sdk[pattern];
      break;
    }
    if (sdk.config?.[pattern]) {
      snapshot.kmsAddress = sdk.config[pattern];
      snapshot.kmsContractAddress = sdk.config[pattern];
      break;
    }
  }

  // Input Verifier addresses
  const inputVerifierPatterns = [
    "inputVerifierAddress",
    "inputVerifierContractAddress",
    "INPUT_VERIFIER_ADDRESS",
    "inputVerifier",
  ];
  for (const pattern of inputVerifierPatterns) {
    if (sdk[pattern]) {
      snapshot.inputVerifierAddress = sdk[pattern];
      snapshot.inputVerifierContractAddress = sdk[pattern];
      break;
    }
    if (sdk.config?.[pattern]) {
      snapshot.inputVerifierAddress = sdk.config[pattern];
      snapshot.inputVerifierContractAddress = sdk.config[pattern];
      break;
    }
  }

  // Decryption Verifier
  const decryptionPatterns = [
    "decryptionVerifierAddress",
    "verifyingContractAddressDecryption",
    "DECRYPTION_ADDRESS",
  ];
  for (const pattern of decryptionPatterns) {
    if (sdk[pattern]) {
      snapshot.decryptionVerifierAddress = sdk[pattern];
      snapshot.verifyingContractAddressDecryption = sdk[pattern];
      break;
    }
    if (sdk.config?.[pattern]) {
      snapshot.decryptionVerifierAddress = sdk.config[pattern];
      snapshot.verifyingContractAddressDecryption = sdk.config[pattern];
      break;
    }
  }

  // Input Verification Gateway
  const inputVerificationPatterns = [
    "inputVerificationGatewayAddress",
    "verifyingContractAddressInputVerification",
    "INPUT_VERIFICATION_ADDRESS",
  ];
  for (const pattern of inputVerificationPatterns) {
    if (sdk[pattern]) {
      snapshot.inputVerificationGatewayAddress = sdk[pattern];
      snapshot.verifyingContractAddressInputVerification = sdk[pattern];
      break;
    }
    if (sdk.config?.[pattern]) {
      snapshot.inputVerificationGatewayAddress = sdk.config[pattern];
      snapshot.verifyingContractAddressInputVerification = sdk.config[pattern];
      break;
    }
  }

  // Relayer URLs
  const relayerPatterns = [
    "relayerUrl",
    "relayerEndpoint",
    "relayerAddress",
    "RELAYER_URL",
    "relayer",
  ];
  for (const pattern of relayerPatterns) {
    if (sdk[pattern]) {
      snapshot.relayerUrl = sdk[pattern];
      snapshot.relayerEndpoint = sdk[pattern];
      break;
    }
    if (sdk.config?.[pattern]) {
      snapshot.relayerUrl = sdk.config[pattern];
      snapshot.relayerEndpoint = sdk.config[pattern];
      break;
    }
  }

  // RPC URLs
  const rpcPatterns = [
    "rpcUrl",
    "rpcEndpoint",
    "RPC_URL",
    "network",
    "providerUrl",
  ];
  for (const pattern of rpcPatterns) {
    if (sdk[pattern]) {
      snapshot.rpcUrl = sdk[pattern];
      snapshot.rpcEndpoint = sdk[pattern];
      break;
    }
    if (sdk.config?.[pattern]) {
      snapshot.rpcUrl = sdk.config[pattern];
      snapshot.rpcEndpoint = sdk.config[pattern];
      break;
    }
  }

  // Gateway URL
  const gatewayPatterns = [
    "gatewayUrl",
    "gatewayEndpoint",
    "GATEWAY_URL",
    "gateway",
  ];
  for (const pattern of gatewayPatterns) {
    if (sdk[pattern]) {
      snapshot.gatewayUrl = sdk[pattern];
      snapshot.gatewayEndpoint = sdk[pattern];
      break;
    }
    if (sdk.config?.[pattern]) {
      snapshot.gatewayUrl = sdk.config[pattern];
      snapshot.gatewayEndpoint = sdk.config[pattern];
      break;
    }
  }

  // Program IDs (Solana-style)
  if (sdk.programIds) {
    snapshot.programIds = sdk.programIds;
  }
  if (sdk.config?.programIds) {
    snapshot.programIds = sdk.config.programIds;
  }
  if (sdk.PROGRAM_IDS) {
    snapshot.programIds = sdk.PROGRAM_IDS;
  }

  // Keys and crypto
  if (sdk.publicKey) {
    snapshot.publicKey = sdk.publicKey;
  }
  if (sdk.config?.publicKey) {
    snapshot.publicKey = sdk.config.publicKey;
  }

  if (sdk.publicParams) {
    snapshot.publicParams = sdk.publicParams;
  }
  if (sdk.config?.publicParams) {
    snapshot.publicParams = sdk.config.publicParams;
  }

  // Full config object
  if (sdk.config) {
    snapshot.config = sdk.config;
  }

  // Capture all enumerable properties (for debugging)
  const allKeys = new Set<string>();
  for (const key in sdk) {
    if (sdk.hasOwnProperty(key)) {
      allKeys.add(key);
    }
  }
  // Also check prototype chain
  let obj = sdk;
  while (obj && obj !== Object.prototype) {
    Object.getOwnPropertyNames(obj).forEach((key) => allKeys.add(key));
    obj = Object.getPrototypeOf(obj);
  }

  const allProperties: Record<string, any> = {};
  for (const key of allKeys) {
    try {
      const value = (sdk as any)[key];
      // Only include serializable values and strings
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null ||
        (typeof value === "object" && !value.constructor.name.includes("HTML"))
      ) {
        allProperties[key] = value;
      }
    } catch (e) {
      // Skip properties that throw on access
    }
  }
  snapshot.allProperties = allProperties;

  return snapshot;
}

/**
 * Pretty-print the SDK config snapshot
 */
export function printSDKConfig(config: SDKConfigSnapshot): void {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("RELAYER SDK CONFIGURATION SNAPSHOT");
  console.log("═══════════════════════════════════════════════════════════════");

  if (config.sdkVersion) {
    console.log(`SDK Version: ${config.sdkVersion}`);
  }

  if (config.initialized !== undefined) {
    console.log(
      `Initialized: ${config.initialized ? "✅ YES" : "❌ NO"}`
    );
  }

  console.log("\n📍 NETWORK CONFIGURATION");
  console.log("───────────────────────────────────────────────────────────────");
  if (config.environment) console.log(`Environment: ${config.environment}`);
  if (config.chainId) console.log(`Chain ID: ${config.chainId}`);
  if (config.gatewayChainId)
    console.log(`Gateway Chain ID: ${config.gatewayChainId}`);
  if (config.networkName) console.log(`Network Name: ${config.networkName}`);

  console.log("\n📋 SMART CONTRACT ADDRESSES");
  console.log("───────────────────────────────────────────────────────────────");
  if (config.aclAddress) console.log(`ACL: ${config.aclAddress}`);
  if (config.kmsAddress) console.log(`KMS Verifier: ${config.kmsAddress}`);
  if (config.inputVerifierAddress)
    console.log(`Input Verifier: ${config.inputVerifierAddress}`);
  if (config.decryptionVerifierAddress)
    console.log(`Decryption Verifier: ${config.decryptionVerifierAddress}`);
  if (config.inputVerificationGatewayAddress)
    console.log(
      `Input Verification Gateway: ${config.inputVerificationGatewayAddress}`
    );

  console.log("\n🌐 SERVICE ENDPOINTS");
  console.log("───────────────────────────────────────────────────────────────");
  if (config.relayerUrl) console.log(`Relayer URL: ${config.relayerUrl}`);
  if (config.rpcUrl) console.log(`RPC URL: ${config.rpcUrl}`);
  if (config.gatewayUrl) console.log(`Gateway URL: ${config.gatewayUrl}`);

  console.log("\n🔑 CRYPTOGRAPHIC MATERIAL");
  console.log("───────────────────────────────────────────────────────────────");
  if (config.publicKey) {
    console.log(`Public Key: ${JSON.stringify(config.publicKey).substring(0, 100)}...`);
  }
  if (config.publicParams) {
    console.log(
      `Public Params: ${JSON.stringify(config.publicParams).substring(0, 100)}...`
    );
  }

  if (config.programIds && Object.keys(config.programIds).length > 0) {
    console.log("\n🎯 PROGRAM IDS");
    console.log("───────────────────────────────────────────────────────────────");
    for (const [key, value] of Object.entries(config.programIds)) {
      console.log(`${key}: ${value}`);
    }
  }

  console.log("\n📊 ALL ENUMERABLE PROPERTIES");
  console.log("───────────────────────────────────────────────────────────────");
  if (config.allProperties) {
    const sortedKeys = Object.keys(config.allProperties).sort();
    for (const key of sortedKeys) {
      const value = config.allProperties[key];
      // Only print non-null, relevant-looking values
      if (value && typeof value !== "function") {
        if (typeof value === "string" && value.length < 200) {
          console.log(`${key}: ${value}`);
        } else if (typeof value === "number" || typeof value === "boolean") {
          console.log(`${key}: ${value}`);
        } else if (typeof value === "object" && key.toLowerCase().includes("config")) {
          console.log(`${key}: ${JSON.stringify(value).substring(0, 100)}...`);
        }
      }
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
}

/**
 * Compare SDK config with our extracted config
 */
export function compareConfigs(
  sdkConfig: SDKConfigSnapshot,
  expectedConfig: Record<string, any>
): Record<string, any> {
  const comparison: Record<string, any> = {
    matches: [],
    mismatches: [],
    sdkOnly: [],
    expectedOnly: [],
  };

  // Extract relevant values from sdkConfig
  const sdkValues: Record<string, any> = {
    aclAddress: sdkConfig.aclAddress,
    kmsAddress: sdkConfig.kmsAddress,
    inputVerifierAddress: sdkConfig.inputVerifierAddress,
    decryptionVerifierAddress: sdkConfig.decryptionVerifierAddress,
    relayerUrl: sdkConfig.relayerUrl,
    rpcUrl: sdkConfig.rpcUrl,
    chainId: sdkConfig.chainId,
    gatewayChainId: sdkConfig.gatewayChainId,
  };

  // Compare
  for (const key of Object.keys(expectedConfig)) {
    if (sdkValues[key] === expectedConfig[key]) {
      comparison.matches.push(key);
    } else if (sdkValues[key]) {
      comparison.mismatches.push({
        key,
        expected: expectedConfig[key],
        sdk: sdkValues[key],
      });
    } else {
      comparison.expectedOnly.push(key);
    }
  }

  for (const key of Object.keys(sdkValues)) {
    if (!expectedConfig.hasOwnProperty(key) && sdkValues[key]) {
      comparison.sdkOnly.push(key);
    }
  }

  return comparison;
}

/**
 * Export config as TypeScript/JSON for copy-paste
 */
export function exportConfigAsCode(config: SDKConfigSnapshot): string {
  const lines: string[] = [
    "// Extracted from Relayer SDK config inspection",
    "export const EXTRACTED_SDK_CONFIG = {",
    `  chainId: ${config.chainId},`,
    `  gatewayChainId: ${config.gatewayChainId},`,
    `  aclContractAddress: '${config.aclAddress || config.aclContractAddress}',`,
    `  kmsContractAddress: '${config.kmsAddress || config.kmsContractAddress}',`,
    `  inputVerifierContractAddress: '${config.inputVerifierAddress || config.inputVerifierContractAddress}',`,
    `  verifyingContractAddressDecryption: '${config.decryptionVerifierAddress || config.verifyingContractAddressDecryption}',`,
    `  verifyingContractAddressInputVerification: '${config.inputVerificationGatewayAddress || config.verifyingContractAddressInputVerification}',`,
    `  relayerUrl: '${config.relayerUrl || config.relayerEndpoint}',`,
    `  network: '${config.rpcUrl || config.rpcEndpoint}',`,
    "};",
  ];
  return lines.join("\n");
}
