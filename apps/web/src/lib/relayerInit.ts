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
  // The Relayer SDK is loaded as a global via CDN script tag
  // After loading, it should be available at window.relayerSDK or as a global
  
  if (!window.relayerSDK) {
    console.warn(
      "[relayerInit] Relayer SDK not found on window.relayerSDK. " +
      "Checking for alternative global names..."
    );
    
    // Try alternative global names that might be used by the SDK
    const alternativeNames = ['ZamaRelayer', 'relayer', 'Relayer'];
    let found = false;
    
    for (const name of alternativeNames) {
      if ((window as any)[name]) {
        console.log(`[relayerInit] Found SDK at window.${name}`);
        (window as any).relayerSDK = (window as any)[name];
        found = true;
        break;
      }
    }
    
    if (!found) {
      throw new Error(
        "Relayer SDK not found. Ensure the CDN script is included in index.html: " +
        "<script src=\"https://cdn.zama.org/relayer-sdk/relayer-sdk.latest.js\"></script>"
      );
    }
  }

  const initOptions = {
    apiKey: options?.apiKey || process.env.VITE_ZAMA_RELAYER_KEY || "",
    env: options?.env || "sepolia",
  };

  try {
    console.log("[relayerInit] Initializing Relayer SDK with env:", initOptions.env);
    
    // The Relayer SDK from CDN provides different initialization patterns
    // depending on version. Try the most common ones:
    
    let initialized = false;
    
    // Pattern 1: initSDK as a method on the SDK object
    if (typeof window.relayerSDK.initSDK === 'function') {
      console.log('[relayerInit] Using SDK.initSDK() pattern...');
      await window.relayerSDK.initSDK(initOptions);
      initialized = true;
    }
    // Pattern 2: init as a method on the SDK object  
    else if (typeof window.relayerSDK.init === 'function') {
      console.log('[relayerInit] Using SDK.init() pattern...');
      await window.relayerSDK.init(initOptions);
      initialized = true;
    }
    // Pattern 3: Direct instantiation or configuration
    else if (typeof window.relayerSDK === 'function') {
      console.log('[relayerInit] Using SDK as constructor pattern...');
      window.relayerSDK = new (window.relayerSDK as any)(initOptions);
      initialized = true;
    }
    
    if (!initialized) {
      console.warn(
        '[relayerInit] Could not detect initialization pattern. Available methods:',
        Object.keys(window.relayerSDK).slice(0, 20)
      );
      // Continue anyway - SDK might auto-initialize
      console.log('[relayerInit] Proceeding with SDK as-is (may auto-initialize)');
    }
    
    console.log("[relayerInit] Relayer SDK initialization complete (or skipped if auto)");
    
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
