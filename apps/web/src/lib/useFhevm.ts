/**
 * useFhevm.ts
 * React hook to manage FHEVM instance lifecycle and initialization
 * Based on Zama's relayer SDK patterns
 */

import { useEffect, useRef, useState } from "react";
import { initRelayerSDK, isRelayerSDKReady } from "./relayerInit";
import { SEPOLIA_FHEVM_CONFIG } from "./fhevmConfig";

export type FhevmStatus = "idle" | "loading" | "ready" | "error";

export interface UseFhevmReturn {
  instance: any | undefined;
  status: FhevmStatus;
  error: Error | undefined;
  refresh: () => void;
}

// Mock chains mapping: chainId => RPC URL
const MOCK_CHAINS: Record<number, string> = {
  11155111: process.env.VITE_SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_PROJECT_ID",
};

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

        // Check if SDK provides built-in Sepolia config
        const hasSepoliaConfig = sdk.SepoliaConfig && sdk.SepoliaConfig.aclContractAddress;
        console.log("[useFhevm] SDK has built-in SepoliaConfig:", hasSepoliaConfig);

        // Build instance config
        const instanceConfig: any = {
          provider: SEPOLIA_FHEVM_CONFIG.rpcUrl,
          mockChains: MOCK_CHAINS, // Maps 11155111 to RPC URL if SDK needs it
        };

        // Use SDK's SepoliaConfig if available, otherwise provide manual overrides
        if (hasSepoliaConfig) {
          console.log("[useFhevm] Using SDK's built-in SepoliaConfig");
          Object.assign(instanceConfig, sdk.SepoliaConfig);
        } else {
          console.log("[useFhevm] Using manual Sepolia config (SDK lacks built-in)");
          instanceConfig.chainId = SEPOLIA_FHEVM_CONFIG.chainId;
          instanceConfig.aclContractAddress = SEPOLIA_FHEVM_CONFIG.aclContractAddress;
          instanceConfig.inputVerifierAddress = SEPOLIA_FHEVM_CONFIG.inputVerifierAddress;
          instanceConfig.kmsVerifierAddress = SEPOLIA_FHEVM_CONFIG.kmsVerifierAddress;
          instanceConfig.publicKeySize = SEPOLIA_FHEVM_CONFIG.publicKeySize;
        }

        const fhevmInstance = await sdk.createInstance(instanceConfig);

        if (abortController.signal.aborted) {
          console.log("[useFhevm] Instance creation aborted");
          return;
        }

        setInstance(fhevmInstance);
        setStatus("ready");
        console.log("[useFhevm] FHEVM instance ready for Sepolia", { chainId: SEPOLIA_FHEVM_CONFIG.chainId });
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
