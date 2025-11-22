/**
 * BROWSER CONSOLE DIAGNOSTIC SCRIPT
 * 
 * Copy and paste into browser console (F12) to inspect Relayer SDK configuration
 * 
 * Usage:
 * 1. Open your VeilScore app in browser
 * 2. Open Developer Tools (F12)
 * 3. Go to Console tab
 * 4. Paste one of the snippets below
 * 5. Look for ACL address, relayer URL, and other config values
 */

// ═══════════════════════════════════════════════════════════════════════════
// QUICK INSPECT (Copy-paste this into console)
// ═══════════════════════════════════════════════════════════════════════════

const inspectQuick = () => {
  console.log("🔍 RELAYER SDK QUICK INSPECTION");
  console.log("═══════════════════════════════════════════════════════════════");

  if (!window.relayerSDK) {
    console.error("❌ window.relayerSDK not found. Is CDN script loaded?");
    return;
  }

  const sdk = window.relayerSDK;

  // Try to get config
  console.log("\n1️⃣ Direct Config Properties:");
  console.log("  config:", sdk.config);
  console.log("  Config keys:", sdk.config ? Object.keys(sdk.config) : "N/A");

  console.log("\n2️⃣ Address Properties:");
  console.log("  aclContractAddress:", sdk.aclContractAddress || sdk.config?.aclContractAddress);
  console.log("  kmsContractAddress:", sdk.kmsContractAddress || sdk.config?.kmsContractAddress);
  console.log("  inputVerifierContractAddress:", sdk.inputVerifierContractAddress || sdk.config?.inputVerifierContractAddress);

  console.log("\n3️⃣ URL Properties:");
  console.log("  relayerUrl:", sdk.relayerUrl || sdk.config?.relayerUrl);
  console.log("  network (RPC):", sdk.network || sdk.config?.network);

  console.log("\n4️⃣ Network Properties:");
  console.log("  chainId:", sdk.chainId || sdk.config?.chainId);
  console.log("  gatewayChainId:", sdk.gatewayChainId || sdk.config?.gatewayChainId);

  console.log("\n5️⃣ All SDK keys:");
  console.log(Object.keys(sdk).sort());

  console.log("\n═══════════════════════════════════════════════════════════════");
};

// ═══════════════════════════════════════════════════════════════════════════
// DETAILED DUMP (Copy-paste this into console)
// ═══════════════════════════════════════════════════════════════════════════

const inspectDetailed = () => {
  console.log("🔬 RELAYER SDK DETAILED DUMP");
  console.log("═══════════════════════════════════════════════════════════════");

  if (!window.relayerSDK) {
    console.error("❌ window.relayerSDK not found");
    return;
  }

  const sdk = window.relayerSDK;

  // Full config object
  console.log("\n📋 FULL CONFIG OBJECT:");
  console.table(sdk.config || {});

  // SDK methods
  console.log("\n🔧 AVAILABLE METHODS:");
  const methods = Object.keys(sdk).filter(
    (key) => typeof sdk[key] === "function"
  );
  console.table(methods);

  // SDK properties
  console.log("\n📊 PROPERTY VALUES:");
  const props: Record<string, any> = {};
  for (const key in sdk) {
    if (typeof sdk[key] !== "function") {
      props[key] = sdk[key];
    }
  }
  console.table(props);

  console.log("\n═══════════════════════════════════════════════════════════════");
};

// ═══════════════════════════════════════════════════════════════════════════
// SEPOLIACONFIG CHECK (Copy-paste this into console)
// ═══════════════════════════════════════════════════════════════════════════

const checkSepoliaConfig = () => {
  console.log("🔎 CHECKING FOR SEPOLIA CONFIG");
  console.log("═══════════════════════════════════════════════════════════════");

  if (!window.relayerSDK) {
    console.error("❌ window.relayerSDK not found");
    return;
  }

  const sdk = window.relayerSDK;

  // Look for SepoliaConfig export
  const keys = Object.keys(sdk);
  console.log("SDK exports:");
  for (const key of keys) {
    if (key.toLowerCase().includes("sepolia") || key.toLowerCase().includes("config")) {
      console.log(`  ✓ ${key}`);
      const value = sdk[key];
      if (typeof value === "object") {
        console.log(`    └─ Type: ${typeof value}`);
        console.log(`    └─ Keys: ${Object.keys(value).join(", ")}`);
        if (value.aclContractAddress) {
          console.log(`    └─ Contains ACL: ${value.aclContractAddress}`);
        }
      }
    }
  }

  // Try direct access
  console.log("\nDirect access attempts:");
  console.log("  sdk.SepoliaConfig:", sdk.SepoliaConfig);
  console.log("  sdk.SEPOLIA_CONFIG:", sdk.SEPOLIA_CONFIG);
  console.log("  sdk.sepoliaConfig:", sdk.sepoliaConfig);
  console.log("  sdk.sepolia:", sdk.sepolia);

  console.log("\n═══════════════════════════════════════════════════════════════");
};

// ═══════════════════════════════════════════════════════════════════════════
// INIT AND INSPECT (Copy-paste this into console)
// ═══════════════════════════════════════════════════════════════════════════

const initAndInspect = async () => {
  console.log("🚀 INITIALIZING SDK AND INSPECTING CONFIG");
  console.log("═══════════════════════════════════════════════════════════════");

  if (!window.relayerSDK) {
    console.error("❌ window.relayerSDK not found");
    return;
  }

  try {
    console.log("⏳ Calling initSDK({ env: 'sepolia' })...");
    await window.relayerSDK.initSDK({ env: "sepolia" });
    console.log("✅ SDK initialized successfully");

    const sdk = window.relayerSDK;

    console.log("\n📍 AFTER INITIALIZATION:");
    console.log("  config:", sdk.config);
    console.log("  __initialized__:", sdk.__initialized__);
    console.log("  initialized:", sdk.initialized);

    // Look for config in various places
    console.log("\n🔍 SEARCHING FOR SEPOLIA CONFIG VALUES:");
    const searches = [
      { key: "aclContractAddress", property: "aclContractAddress" },
      { key: "kmsContractAddress", property: "kmsContractAddress" },
      { key: "inputVerifierContractAddress", property: "inputVerifierContractAddress" },
      { key: "verifyingContractAddressDecryption", property: "verifyingContractAddressDecryption" },
      { key: "relayerUrl", property: "relayerUrl" },
      { key: "network", property: "network" },
      { key: "chainId", property: "chainId" },
      { key: "gatewayChainId", property: "gatewayChainId" },
    ];

    for (const search of searches) {
      const value =
        sdk[search.property] ||
        sdk.config?.[search.property] ||
        sdk[search.key] ||
        sdk.config?.[search.key];
      if (value) {
        console.log(`  ✓ ${search.property}: ${value}`);
      }
    }

    // Check for SepoliaConfig export
    if (sdk.SepoliaConfig) {
      console.log("\n✅ SDK.SepoliaConfig found!");
      console.log("  ", sdk.SepoliaConfig);
    } else {
      console.log("\n⚠️ SDK.SepoliaConfig NOT found (may be in sdk.config instead)");
    }

    console.log("\n═══════════════════════════════════════════════════════════════");
  } catch (err) {
    console.error("❌ Error during initialization:", err);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PASTE IN CONSOLE (ONE LINE FOR QUICK RUN)
// ═══════════════════════════════════════════════════════════════════════════

// Run quick inspection:
// inspectQuick();

// Run detailed dump:
// inspectDetailed();

// Check for SepoliaConfig:
// checkSepoliaConfig();

// Initialize and inspect:
// await initAndInspect();

// ═══════════════════════════════════════════════════════════════════════════
// WHAT TO LOOK FOR
// ═══════════════════════════════════════════════════════════════════════════

/*
Expected values (from relayer-sdk/src/index.ts SepoliaConfig):

  chainId: 11155111
  gatewayChainId: 10901
  aclContractAddress: '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D'
  kmsContractAddress: '0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A'
  inputVerifierContractAddress: '0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0'
  verifyingContractAddressDecryption: '0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478'
  verifyingContractAddressInputVerification: '0x483b9dE06E4E4C7D35CCf5837A1668487406D955'
  relayerUrl: 'https://relayer.testnet.zama.org'
  network: 'https://ethereum-sepolia-rpc.publicnode.com'

If you see these values in the SDK config, it means:
  ✅ SDK has built-in Sepolia config (preferred)
  ✅ No need for manual override
  ✅ Config is always in sync with Zama deployments

If you don't see these values:
  ⏳ Need to use our extracted fhevmNetworkConfig.ts (fallback)
  ⏳ Or SDK is using different naming convention
*/

// ═══════════════════════════════════════════════════════════════════════════
export const consoleDiagnostics = {
  quick: inspectQuick,
  detailed: inspectDetailed,
  sepoliaConfig: checkSepoliaConfig,
  init: initAndInspect,
};
