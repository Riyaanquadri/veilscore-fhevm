/**
 * relayerInit.ts
 * Initialize Zama's Relayer SDK for FHEVM on Sepolia
 * NOTE: Replace placeholders with actual values from Zama docs
 */

declare global {
  interface Window {
    relayerSDK: any;
  }
}

export interface RelayerInitOptions {
  apiKey?: string;
  env?: "sepolia" | "devnet" | "mainnet";
}

export async function initRelayerSDK(options?: RelayerInitOptions) {
  if (!window.relayerSDK) {
    throw new Error(
      "Relayer SDK script not loaded. Ensure CDN script is included in index.html"
    );
  }

  const initOptions = {
    apiKey: options?.apiKey || process.env.VITE_ZAMA_RELAYER_KEY || "",
    env: options?.env || "sepolia",
  };

  try {
    console.log("[relayerInit] Initializing Relayer SDK with env:", initOptions.env);
    await window.relayerSDK.initSDK(initOptions);
    console.log("[relayerInit] Relayer SDK initialized successfully");
    
    // Log SDK configuration for debugging
    if (window.relayerSDK.config) {
      console.log("[relayerInit] SDK Config keys:", Object.keys(window.relayerSDK.config));
      logSDKConfig();
    }
    
    // Check for SepoliaConfig export
    if (window.relayerSDK.SepoliaConfig) {
      console.log("[relayerInit] ✅ SDK.SepoliaConfig found (built-in Sepolia defaults available)");
    } else {
      console.log("[relayerInit] ⚠️ SDK.SepoliaConfig not found (will use fhevmNetworkConfig fallback)");
    }
    
    return window.relayerSDK;
  } catch (err) {
    console.error("[relayerInit] Failed to initialize Relayer SDK:", err);
    throw err;
  }
}

/**
 * Log SDK configuration to console for debugging
 * Shows all relevant network addresses and endpoints
 */
function logSDKConfig(): void {
  if (!window.relayerSDK) return;

  const sdk = window.relayerSDK;
  const config = sdk.config || {};

  console.group("[relayerInit] SDK Configuration");
  console.log("Environment:", config.env || config.environment || "unknown");
  console.log("Chain ID:", config.chainId || "unknown");
  console.log("Gateway Chain ID:", config.gatewayChainId || "unknown");
  console.log("---");
  console.log(
    "ACL Address:",
    config.aclContractAddress || "not found"
  );
  console.log(
    "KMS Contract:",
    config.kmsContractAddress || "not found"
  );
  console.log(
    "Input Verifier:",
    config.inputVerifierContractAddress || "not found"
  );
  console.log(
    "Decryption Verifier:",
    config.verifyingContractAddressDecryption || "not found"
  );
  console.log("---");
  console.log("Relayer URL:", config.relayerUrl || "not found");
  console.log("RPC URL:", config.network || "not found");
  console.groupEnd();
}

/**
 * Get specific config value from SDK
 * Searches common naming patterns
 */
export function getSDKConfigValue(key: string): any {
  if (!window.relayerSDK) return null;

  const sdk = window.relayerSDK;
  const config = sdk.config || {};

  // Try direct access
  if (sdk[key]) return sdk[key];
  if (config[key]) return config[key];

  // Try common alternatives
  const alternatives: Record<string, string[]> = {
    aclContractAddress: ["aclAddress", "ACL_ADDRESS", "acl"],
    kmsContractAddress: ["kmsAddress", "KMS_ADDRESS", "kms"],
    relayerUrl: ["relayerEndpoint", "RELAYER_URL", "relayer"],
  };

  if (alternatives[key]) {
    for (const alt of alternatives[key]) {
      if (sdk[alt]) return sdk[alt];
      if (config[alt]) return config[alt];
    }
  }

  return null;
}
export function isRelayerSDKReady(): boolean {
  return (
    typeof window !== "undefined" &&
    window.relayerSDK !== undefined &&
    window.relayerSDK.__initialized__ === true
  );
}

/**
 * Get the initialized Relayer SDK instance
 */
export function getRelayerSDK() {
  if (!isRelayerSDKReady()) {
    throw new Error("Relayer SDK not initialized. Call initRelayerSDK first.");
  }
  return window.relayerSDK;
}
