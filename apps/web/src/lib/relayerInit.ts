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
    return window.relayerSDK;
  } catch (err) {
    console.error("[relayerInit] Failed to initialize Relayer SDK:", err);
    throw err;
  }
}

/**
 * Check if Relayer SDK is ready for use
 */
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
