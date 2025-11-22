// BROWSER CONSOLE QUICK REFERENCE
// ════════════════════════════════════════════════════════════════════════════
// Copy & paste these commands into browser console (F12 → Console tab)
// to inspect Relayer SDK configuration
// ════════════════════════════════════════════════════════════════════════════

// 1. CHECK SDK LOADED
window.relayerSDK

// 2. INITIALIZE SDK
await window.relayerSDK.initSDK({ env: 'sepolia' })

// 3. VIEW ALL CONFIG
window.relayerSDK.config

// 4. GET ALL ADDRESSES AT ONCE
const cfg = window.relayerSDK.config || {};
console.table({
  'ACL': cfg.aclContractAddress,
  'KMS': cfg.kmsContractAddress,
  'InputVerifier': cfg.inputVerifierContractAddress,
  'DecryptionVerifier': cfg.verifyingContractAddressDecryption,
  'InputVerificationGateway': cfg.verifyingContractAddressInputVerification,
  'RelayerURL': cfg.relayerUrl,
  'RPC': cfg.network,
  'ChainId': cfg.chainId,
  'GatewayChainId': cfg.gatewayChainId,
})

// 5. CHECK FOR SEPOLIACONFIG EXPORT
window.relayerSDK.SepoliaConfig

// 6. QUICK SUMMARY (ALL-IN-ONE)
await window.relayerSDK.initSDK({ env: 'sepolia' });
const cfg = window.relayerSDK.config || {};
console.log('=== RELAYER SDK CONFIG ===');
console.log('ACL:', cfg.aclContractAddress);
console.log('KMS:', cfg.kmsContractAddress);
console.log('InputVerifier:', cfg.inputVerifierContractAddress);
console.log('Relayer:', cfg.relayerUrl);
console.log('ChainId:', cfg.chainId);
console.log('GatewayChainId:', cfg.gatewayChainId);
console.log('Network:', cfg.network);
console.log('SepoliaConfig available:', !!window.relayerSDK.SepoliaConfig);

// EXPECTED VALUES (from relayer-sdk)
// ════════════════════════════════════════════════════════════════════════════
// aclContractAddress: 0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D
// kmsContractAddress: 0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A
// inputVerifierContractAddress: 0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0
// verifyingContractAddressDecryption: 0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478
// verifyingContractAddressInputVerification: 0x483b9dE06E4E4C7D35CCf5837A1668487406D955
// relayerUrl: https://relayer.testnet.zama.org
// network: https://ethereum-sepolia-rpc.publicnode.com
// chainId: 11155111
// gatewayChainId: 10901

// INTERPRETATION
// ════════════════════════════════════════════════════════════════════════════
// ✅ All values match → SDK has built-in Sepolia config (optimal)
// ⏳ Values undefined → SDK doesn't expose config (use fhevmNetworkConfig.ts)
// ⚠️ Different values → Zama updated deployments (check docs.zama.org)
