/**
 * useFhevm.ts
 * React hook to manage FHEVM instance lifecycle and initialization
 * 
 * Integrates with Zama Relayer SDK using official Sepolia network configuration
 * See: https://github.com/zama-ai/relayer-sdk
 */

import { useEffect, useRef, useState } from "react";
import { initRelayerSDK, isRelayerSDKReady } from "./relayerInit";
import { ZAMA_SEPOLIA_CONFIG } from "./fhevmNetworkConfig";

export type FhevmStatus = "idle" | "loading" | "ready" | "error";

export interface UseFhevmReturn {
  instance: any | undefined;
  status: FhevmStatus;
  error: Error | undefined;
  refresh: () => void;
}

/**
 * Mock chains mapping for local testing
 * Maps chain IDs to RPC URLs for SDK compatibility
 */
const MOCK_CHAINS: Record<number, string> = {
  11155111: process.env.VITE_FHEVM_RPC_URL || ZAMA_SEPOLIA_CONFIG.network,
  31337: "http://localhost:8545", // Local Hardhat node for development
};

/**
 * Hook to initialize and manage FHEVM instance
 * 
 * Flow:
 * 1. Initialize Relayer SDK (if not already done)
 * 2. Check if SDK has built-in SepoliaConfig
 * 3. If yes, use SDK's config (preferred)
 * 4. If no, use our fhevmNetworkConfig (fallback)
 * 5. Create FHEVM instance and return
 * 
 * Extracted Zama SDK config:
 * - ACL: 0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D
 * - KMS: 0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A
 * - InputVerifier: 0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0
 * - RelayerUrl: https://relayer.testnet.zama.org
 * - ChainId: 11155111 (Sepolia)
 */
export function useFhevm(): UseFhevmReturn {
  const [instance, setInstance] = useState<any | undefined>(undefined);
  const [status, setStatus] = useState<FhevmStatus>("idle");
  const [error, setError] = useState<Error | undefined>(undefined);
  const initAbortRef = useRef<AbortController | null>(null);

  const refresh = () => {
    if (initAbortRef.current) {
      initAbortRef.current.abort();
    }
    setInstance(undefined);
    setError(undefined);
    setStatus("idle");
  };

  useEffect(() => {
    const initialize = async () => {
      if (status !== "idle") return;

      const abortController = new AbortController();
      initAbortRef.current = abortController;

      try {
        setStatus("loading");
        setError(undefined);

        console.log("[useFhevm] Checking if Relayer SDK is ready...");
        if (!isRelayerSDKReady()) {
          console.log("[useFhevm] Initializing Relayer SDK...");
          await initRelayerSDK({ env: "sepolia" });
        }

        if (abortController.signal.aborted) {
          console.log("[useFhevm] Initialization aborted");
          return;
        }

        console.log("[useFhevm] Creating FHEVM instance with Sepolia config...");
        const sdk = window.relayerSDK;

        // Check if SDK provides built-in Sepolia config (preferred)
        const hasSepoliaConfig = sdk.SepoliaConfig && sdk.SepoliaConfig.aclContractAddress;
        console.log("[useFhevm] SDK has built-in SepoliaConfig:", hasSepoliaConfig);

        // Build instance config, starting with mock chains for SDK compatibility
        const instanceConfig: any = {
          mockChains: MOCK_CHAINS,
        };

        // Use SDK's SepoliaConfig if available (from relayer-sdk/src/index.ts)
        if (hasSepoliaConfig) {
          console.log("[useFhevm] Using SDK's built-in SepoliaConfig from Relayer SDK");
          // SDK's SepoliaConfig includes all required contract addresses
          Object.assign(instanceConfig, sdk.SepoliaConfig);
          console.log("[useFhevm] SDK config addresses:", {
            acl: sdk.SepoliaConfig.aclContractAddress,
            relayerUrl: sdk.SepoliaConfig.relayerUrl,
          });
        } else {
          console.log("[useFhevm] Using fallback Zama config from fhevmNetworkConfig.ts");
          // Fallback: use our extracted config from relayer-sdk repo
          // See: https://github.com/zama-ai/relayer-sdk/blob/main/src/index.ts (SepoliaConfig)
          Object.assign(instanceConfig, ZAMA_SEPOLIA_CONFIG);
          console.log("[useFhevm] Fallback config addresses:", {
            acl: ZAMA_SEPOLIA_CONFIG.aclContractAddress,
            relayerUrl: ZAMA_SEPOLIA_CONFIG.relayerUrl,
          });
        }

        const fhevmInstance = await sdk.createInstance(instanceConfig);

        if (abortController.signal.aborted) {
          console.log("[useFhevm] Instance creation aborted");
          return;
        }

        setInstance(fhevmInstance);
        setStatus("ready");
        console.log("[useFhevm] FHEVM instance ready for Sepolia", {
          chainId: instanceConfig.chainId || ZAMA_SEPOLIA_CONFIG.chainId,
          relayerUrl: instanceConfig.relayerUrl || ZAMA_SEPOLIA_CONFIG.relayerUrl,
        });
      } catch (err) {
        if (!abortController.signal.aborted) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          setStatus("error");
          console.error("[useFhevm] Initialization error:", error);
        }
      } finally {
        initAbortRef.current = null;
      }
    };

    initialize();

    return () => {
      if (initAbortRef.current) {
        initAbortRef.current.abort();
      }
    };
  }, []);

  return { instance, status, error, refresh };
}
