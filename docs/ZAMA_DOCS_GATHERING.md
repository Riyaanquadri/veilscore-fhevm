# Zama Documentation Gathering Checklist

**Purpose:** Collect exact details from Zama FHEVM documentation to configure VeilScore for production.

**Status:** Pre-integration checklist — use this to gather requirements before finalizing component wiring.

---

## 1. Sepolia FHEVM RPC & Network Configuration

### What You Need

```
VITE_FHEVM_SEPOLIA_RPC = <dedicated RPC endpoint or standard Sepolia RPC>
FHEVM_CHAIN_ID = 11155111 (Sepolia)
FHEVM_NETWORK_NAME = "Sepolia"
```

### Zama Docs to Check

- [ ] **Zama FHEVM Sepolia Testnet Documentation**
  - URL pattern: https://docs.zama.ai/fhevm/getting-started/...
  - Look for: "Sepolia Network Configuration" or "Testnet RPC"
  - Question: Does Zama publish a dedicated RPC endpoint for Sepolia FHEVM?
  - Alternative: Use standard Sepolia RPC (Infura, Alchemy, QuickNode)
  
- [ ] **Network Details**
  - Chain ID: `11155111`
  - Network Name: `Sepolia`
  - Block time: ~12 seconds (standard Ethereum)
  - Confirmation time: ~1-2 blocks (~15-30 seconds)

### Current Configuration

```typescript
// apps/web/src/lib/fhevmConfig.ts
export const FHEVM_SEPOLIA_CONFIG = {
  chainId: 11155111,
  rpcUrl: process.env.VITE_FHEVM_SEPOLIA_RPC || 'https://sepolia.infura.io/v3/YOUR_KEY',
  // ... other config
};
```

### Action Items

- [ ] Check Zama docs for dedicated Sepolia RPC endpoint
- [ ] If available, update `VITE_FHEVM_SEPOLIA_RPC` in `.env`
- [ ] If not, use Infura/Alchemy Sepolia RPC as fallback
- [ ] Verify RPC works: `curl -X POST https://sepolia.infura.io/v3/YOUR_KEY -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'`

---

## 2. Relayer SDK – Installation & CDN

### What You Need

```
SDK_PACKAGE_NAME = "@zama/fhevm-sdk" or similar
SDK_VERSION = "X.X.X" (exact version)
SDK_SOURCE = "npm" or "CDN_URL"
```

### Zama Docs to Check

- [ ] **Relayer SDK Installation**
  - URL: https://docs.zama.ai/fhevm/sdk/... or https://docs.zama.ai/fhevm/relayer/...
  - Look for: "npm install" command or "Installation"
  - Questions:
    - Is the SDK available via npm?
    - What's the exact package name?
    - What's the latest stable version?
  
- [ ] **CDN Distribution (if available)**
  - Look for: "<script src=..." or UMD bundle
  - Question: Is there a CDN URL for browser usage?
  - Example format: `https://cdn.jsdelivr.net/npm/@zama/fhevm-sdk@X.X.X/dist/index.js`

- [ ] **Relayer Service Documentation**
  - URL: https://docs.zama.ai/fhevm/relayer/...
  - Look for: "Relayer Service", "Getting Started", or "Integration Guide"
  - Question: Is there a hosted relayer service or must we run our own?

### Current Setup

```typescript
// apps/web/src/lib/relayerInit.ts
// Requires: window.relayerSDK (loaded via CDN or npm)
// For local testing: Uses worker/relayerStub.js
```

### Action Items

- [ ] Find SDK package name and npm registry link
- [ ] Check latest version number
- [ ] Verify npm installation: `npm search @zama` (or similar)
- [ ] Get CDN URL (if available)
- [ ] Download and test in browser console
- [ ] Update package.json or HTML script tag

### Expected Output

```json
{
  "sdk_name": "@zama/fhevm-sdk",
  "latest_version": "X.X.X",
  "npm_url": "https://www.npmjs.com/package/@zama/fhevm-sdk",
  "cdn_url": "https://cdn.jsdelivr.net/npm/@zama/fhevm-sdk@X.X.X/dist/index.js",
  "npm_install": "npm install @zama/fhevm-sdk@X.X.X"
}
```

---

## 3. Relayer SDK API – Exact Function Names & Options

### What You Need

```typescript
// Exact function signatures from Zama SDK
const instance = await SDK.createFhevmInstance({ ... });
const result = await instance.initSDK({ ... });
const encrypted = await instance.encrypt(...);
```

### Zama Docs to Check

- [ ] **SDK API Reference**
  - URL: https://docs.zama.ai/fhevm/api/... or https://docs.zama.ai/fhevm/sdk/reference
  - Look for: "API Reference", "Methods", "Functions"
  
- [ ] **createFhevmInstance() Documentation**
  - Questions:
    - What are the exact parameter names?
    - What options are required vs optional?
    - What does it return?
  - Example we need:
    ```typescript
    const instance = await SDK.createFhevmInstance({
      chainId: 11155111,
      rpcUrl: "https://sepolia.infura.io/...",
      publicKey: { ... },
      // ... other required params
    });
    ```

- [ ] **initSDK() Documentation**
  - Questions:
    - Is this a method on the instance or a standalone function?
    - What configuration does it accept?
    - What does initialization do?
  - Example we need:
    ```typescript
    const result = await instance.initSDK({
      // What goes here?
    });
    ```

- [ ] **Encryption Methods**
  - Look for: `encrypt()`, `encryptWithPublicKey()`, or similar
  - Questions:
    - What's the exact method name?
    - What parameters does it take?
    - What does it return (ciphertext format)?
  - Example we need:
    ```typescript
    const ciphertext = await instance.encrypt(plaintext, options);
    ```

- [ ] **Decryption Methods**
  - Look for: `decrypt()`, `decryptResult()`, or similar
  - Questions:
    - What's the exact method name?
    - Can users decrypt locally (Model 1) or relayer-only?
    - What parameters does it take?

- [ ] **Key Generation & Management**
  - Look for: `generateKeys()`, `createKeyPair()`, or similar
  - Questions:
    - How to generate TFHE key pair?
    - Where is the private key stored (browser, server)?
    - Public key format (what to send to relayer)?

### Current Placeholder

```typescript
// apps/web/src/lib/useFhevm.ts
export const useFhevm = () => {
  // TODO: Replace with exact Zama SDK API calls
  const createInstance = async () => {
    // const instance = await window.relayerSDK.createFhevmInstance({ ... });
    // const initialized = await instance.initSDK({ ... });
    // return initialized;
  };
};
```

### Action Items

- [ ] Read Zama SDK API reference completely
- [ ] Document all required parameters for each function
- [ ] Note any version-specific differences
- [ ] Check for TypeScript type definitions
- [ ] Create mapping file: `SDK_API_MAPPING.md`

### Expected Output

```typescript
// SDK_API_MAPPING.json or similar
{
  "createFhevmInstance": {
    "parameters": {
      "chainId": "number",
      "rpcUrl": "string",
      "publicKey": "PublicKeyType",
      "acl": "string (address)",
      "verifier": "string (address)"
    },
    "returns": "FhevmInstance"
  },
  "initSDK": {
    "callable_on": "FhevmInstance",
    "parameters": {
      "/* exact params from docs */"
    },
    "returns": "void or { /* result */ }"
  },
  "encrypt": {
    "callable_on": "FhevmInstance",
    "parameters": {
      "plaintext": "number or BigInt",
      "type": "uint8|uint16|uint32|uint64 (optional)",
      "publicKey": "PublicKeyType (optional)"
    },
    "returns": "string (hex-encoded ciphertext)"
  }
}
```

---

## 4. ACL (Access Control List) Contract Configuration

### What You Need

```solidity
address public ACL_ADDRESS = 0x...;
address public VERIFIER_ADDRESS = 0x...;
```

### Zama Docs to Check

- [ ] **ACL Contract Address on Sepolia**
  - URL: https://docs.zama.ai/fhevm/sepolia-testnet or https://docs.zama.ai/fhevm/networks
  - Look for: "ACL Address", "Testnet Contracts", "Sepolia Deployment"
  - Question: What's the ACL contract address on Sepolia (0x...)?
  
- [ ] **Verifier Contract Address on Sepolia**
  - Look for: "Verifier", "Input Verifier", "Threshold Encryptor"
  - Question: What's the Verifier contract address on Sepolia?

- [ ] **ACL Registration Function**
  - Look for: "registerAcl()", "addToACL()", or similar
  - Questions:
    - What's the exact function name?
    - What parameters does it take?
    - Who can call it (msg.sender)?
    - What does "registration" do?
  - Example we need:
    ```solidity
    // On ACL contract
    function registerAcl(address acl, address verifier) external { ... }
    // Or similar
    ```

- [ ] **ACL ABI (Application Binary Interface)**
  - Look for: JSON ABI file
  - URL: GitHub repo, docs site, or npm package
  - Questions:
    - Where's the full ABI for the ACL contract?
    - What functions does it expose?

### Current Configuration

```typescript
// apps/web/src/lib/fhevmConfig.ts
export const FHEVM_SEPOLIA_CONFIG = {
  acl: process.env.VITE_ACL_ADDRESS || '0x...',
  verifier: process.env.VITE_VERIFIER_ADDRESS || '0x...',
};

// hardhat.config.ts
const ACL_ADDRESS = process.env.ACL_ADDRESS || '0x...';
const VERIFIER_ADDRESS = process.env.VERIFIER_ADDRESS || '0x...';
```

### Action Items

- [ ] Find ACL address on Sepolia (Etherscan link)
- [ ] Find Verifier address on Sepolia
- [ ] Get ACL contract ABI (JSON format)
- [ ] Document registration function signature
- [ ] Update `.env` with addresses
- [ ] Test registration: `npx hardhat run scripts/registerAcl.ts --network sepolia`

### Expected Output

```json
{
  "acl_address_sepolia": "0x...",
  "verifier_address_sepolia": "0x...",
  "acl_registration_function": "registerAcl(address acl, address verifier) external",
  "acl_abi_source": "https://github.com/zama-ai/fhevm/blob/main/...",
  "etherscan_link": "https://sepolia.etherscan.io/address/0x..."
}
```

---

## 5. Relayer Endpoint Configuration & API Keys

### What You Need

```
RELAYER_ENDPOINT = "https://..."
RELAYER_API_KEY = "<if required>"
RELAYER_AUTH_HEADER = "Authorization: Bearer <key>" or similar
```

### Zama Docs to Check

- [ ] **Relayer Service Hosting**
  - URL: https://docs.zama.ai/fhevm/relayer or https://docs.zama.ai/fhevm/services
  - Questions:
    - Does Zama host a relayer service?
    - Can we use it without running our own?
    - What's the endpoint URL?
  
- [ ] **Relayer Endpoint Documentation**
  - Look for: "POST /evaluate", "API Endpoint", "Integration"
  - Questions:
    - What's the exact endpoint URL?
    - Does it require authentication?
    - What headers are required?
    - What's the request/response format?
  - Example we need:
    ```javascript
    // POST https://relayer.zama.ai/api/evaluate (or similar)
    // Headers:
    //   Authorization: Bearer <API_KEY> (if required)
    //   Content-Type: application/json
    // Body:
    //   {
    //     "encryptedInput": "0x...",
    //     "publicKey": { ... },
    //     "owner": "0x..."
    //   }
    // Response:
    //   {
    //     "commitment": "0x...",
    //     "allowed": true,
    //     "signature": "0x..."
    //   }
    ```

- [ ] **API Key Management**
  - Look for: "API Keys", "Authentication", "Rate Limits"
  - Questions:
    - How to get an API key?
    - Where to store it (environment variable)?
    - Any rate limits?
    - Expiration policy?

- [ ] **Error Handling & Retry Logic**
  - Look for: "Error Codes", "Rate Limiting", "Timeouts"
  - Questions:
    - What HTTP status codes can be returned?
    - How long do evaluations take?
    - What's the timeout recommendation?

### Current Configuration

```typescript
// apps/web/src/lib/relayerClient.ts
const RELAYER_ENDPOINT = process.env.VITE_RELAYER_ENDPOINT || 'http://localhost:3000';
const RELAYER_API_KEY = process.env.VITE_RELAYER_API_KEY;

async function submitToRelayer(payload) {
  const headers = {
    'Content-Type': 'application/json',
    // 'Authorization': RELAYER_API_KEY ? `Bearer ${RELAYER_API_KEY}` : undefined,
  };
  
  const response = await fetch(`${RELAYER_ENDPOINT}/api/evaluate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  
  return response.json();
}
```

### Action Items

- [ ] Find Zama's hosted relayer endpoint (if available)
- [ ] Get API key (or confirm no key needed for testnet)
- [ ] Document exact request/response format
- [ ] Test endpoint with curl or Postman
- [ ] Implement retry logic and timeout handling
- [ ] Update `.env` with endpoint and key

### Expected Output

```json
{
  "relayer_endpoint": "https://relayer.zama.ai/api/evaluate (or localhost:3000 for dev)",
  "requires_api_key": false,
  "authentication_type": "none or Bearer token",
  "request_format": {
    "encryptedInput": "hex string",
    "publicKey": "object",
    "owner": "0x address",
    "commitment": "0x hash"
  },
  "response_format": {
    "commitment": "0x hash",
    "allowed": "boolean",
    "signature": "0x hex string"
  },
  "timeout_ms": 30000,
  "rate_limit": "none or requests/minute"
}
```

---

## 6. TFHE Key Generation & Key Management

### What You Need

```typescript
const keyPair = {
  publicKey: { /* specific format from Zama */ },
  privateKey: { /* specific format from Zama */ },
};

// Storage strategy:
// - Private key: Browser localStorage + sessionStorage (never send to server)
// - Public key: Send to relayer (safe, not used for decryption)
```

### Zama Docs to Check

- [ ] **TFHE Key Generation**
  - Look for: "Key Generation", "generateKeys()", "createKeyPair()"
  - Questions:
    - How to generate a TFHE key pair?
    - What's the exact function call?
    - How long does generation take?
    - Can it be done in browser (WASM)?
  
- [ ] **Key Storage Best Practices**
  - Look for: "Security", "Key Management", "Storage"
  - Questions:
    - Where should the private key be stored?
    - Is browser storage secure enough?
    - Should we use Web Crypto API?
    - Any key rotation recommendations?

- [ ] **Public Key Format**
  - Look for: "Public Key Format", "Serialization"
  - Questions:
    - What format is the public key (JSON, hex, bytes)?
    - How to serialize for transmission?
    - How does relayer use it?

- [ ] **Private Key Format & Decryption (Model 1 only)**
  - Look for: "Private Key", "Decryption", "Local Decryption"
  - Questions:
    - Can users decrypt results locally with their private key?
    - Or is decryption relayer-only (Model 2)?
    - What's the function signature?

### Current Implementation

```typescript
// apps/web/src/lib/encryption.ts
export async function generateTFHEKeyPair() {
  // TODO: Replace with exact Zama SDK call
  // const keyPair = await window.relayerSDK.generateKeys(...);
  // return keyPair;
}

export async function encryptWithTFHE(publicKey, plaintext) {
  // TODO: Replace with exact Zama SDK call
  // const ciphertext = await window.relayerSDK.encrypt(plaintext, publicKey);
  // return ciphertext;
}

export function storePrivateKeyLocally(privateKey) {
  // Browser: localStorage or sessionStorage
  // Session-based: sessionStorage only
  localStorage.setItem('tfhe_private_key', JSON.stringify(privateKey));
}
```

### Action Items

- [ ] Get exact key generation function signature
- [ ] Understand key format (JSON object structure)
- [ ] Document serialization method
- [ ] Decide on key storage strategy (sessionStorage vs localStorage)
- [ ] Implement key management utilities
- [ ] Test decryption path if Model 1 is chosen

### Expected Output

```typescript
{
  "key_generation_function": "window.relayerSDK.generateKeys() or similar",
  "key_generation_time_ms": 500,  // estimate
  "public_key_format": {
    "type": "object or hex string",
    "structure": { /* exact JSON structure */ }
  },
  "private_key_format": {
    "type": "object or hex string",
    "structure": { /* exact JSON structure */ }
  },
  "storage_recommendation": "sessionStorage (ephemeral) or localStorage (persistent)",
  "supports_local_decryption": true,  // or false
  "encryption_function": "instance.encrypt(plaintext, publicKey, options)",
  "decryption_function": "instance.decrypt(ciphertext, privateKey)"
}
```

---

## 7. FHE Computation (Scoring Logic) Specification

### What You Need

```solidity
// From Zama FHEVM documentation:
// What FHE operations are available?
// - Arithmetic: +, -, *, / (on encrypted values)?
// - Comparison: >, <, ==, != (encrypted vs encrypted)?
// - Logical: &&, ||, ! (on encrypted booleans)?
```

### Zama Docs to Check

- [ ] **Supported FHE Operations**
  - URL: https://docs.zama.ai/fhevm/operators or https://docs.zama.ai/fhevm/solidity
  - Look for: "Operators", "Supported Operations", "FHE in Solidity"
  - Questions:
    - What arithmetic operations work on encrypted values?
    - Can we compare encrypted numbers?
    - Can we conditionally branch on encrypted results?

- [ ] **Encrypted Types**
  - Look for: "ebool", "euint8", "euint16", "euint32", "euint64"
  - Questions:
    - What encrypted types are available?
    - Do we need uint32 for scores (0-100)?
    - How about for booleans (allowed/denied)?

- [ ] **FHE Program Example in Solidity**
  - Look for: "Examples", "Tutorials", or "Sample Code"
  - Questions:
    - Show a complete example of encrypted scoring logic
    - How to compute threshold check (score >= 50)?
    - How to return encrypted or plaintext result?

### Current Scoring Logic (Mock)

```solidity
// contracts/VeilScore.sol
function computeScore(
    uint256 socialScore,
    uint256 trustSignals,
    // ... other inputs
) internal pure returns (uint256, bool) {
    // Mock scoring algorithm
    uint256 score = (socialScore * 0.4) + (trustSignals * 0.6);
    bool allowed = score >= MIN_VEILSCORE_THRESHOLD;  // 50
    return (score, allowed);
}
```

### Action Items

- [ ] Review Zama FHE operations documentation
- [ ] Understand encrypted type system
- [ ] Map scoring algorithm to FHE operations
- [ ] Decide: compute on-chain (if FHE operations available) or relayer (current approach)
- [ ] Update contract or relayer with final logic

### Expected Output

```json
{
  "available_operations": ["+", "-", "*", "/", ">", "<", "==", "!=", "&&", "||", "!"],
  "encrypted_types": ["ebool", "euint8", "euint16", "euint32", "euint64"],
  "compute_location": "relayer (current Model 2) or on-chain (if FHE native)",
  "example_threshold_check": "ebool allowed = score > euint32(50);",
  "performance_estimate": "FHE operations are slower than plaintext; may take 500ms-2s"
}
```

---

## 8. Additional Integration Concerns

### Check These Zama Docs Too

- [ ] **Transaction Costs (Gas)**
  - Look for: "Gas", "Costs", "Optimization"
  - Questions:
    - How much gas does `submitWithSig()` cost?
    - Does ACL registration cost extra gas?
    - Any tips for optimization?

- [ ] **Testnet Faucet & ETH**
  - Look for: "Faucet", "Getting Sepolia ETH", "Testnet Setup"
  - Questions:
    - How to get testnet ETH?
    - What's the drip amount?
    - Any rate limits?

- [ ] **Etherscan/Block Explorer Integration**
  - Look for: "Sepolia Explorer", "Scanning Transactions"
  - Question: Can we view FHEVM transactions on standard Sepolia explorer?

- [ ] **SDK Changelog & Breaking Changes**
  - Look for: "Changelog", "Migration Guide", "Breaking Changes"
  - Question: Are there known breaking changes between SDK versions?

- [ ] **Error Codes & Debugging**
  - Look for: "Troubleshooting", "Common Errors", "Debug Mode"
  - Questions:
    - Common error codes and meanings?
    - How to enable debug logging?
    - How to diagnose FHE evaluation failures?

---

## Gathering Template

Use this to organize information as you find it:

```markdown
## Found: [TOPIC]

**Source URL:** [link to Zama docs]

**Date Found:** [date]

**Exact Information:**
```
[paste exact text or code]
```

**Action Items:**
- [ ] Item 1
- [ ] Item 2

**Confidence Level:** High / Medium / Low
```

---

## Priority Order

Gather in this order (most critical first):

1. **CRITICAL (Do this first)**
   - Section 1: Sepolia RPC URL
   - Section 2: SDK package name & version
   - Section 3: SDK API (createFhevmInstance, encrypt, decrypt)
   - Section 4: ACL address on Sepolia

2. **HIGH (Do this second)**
   - Section 5: Relayer endpoint & authentication
   - Section 6: TFHE key generation & storage
   - Section 8: Testnet faucet

3. **MEDIUM (Do this third)**
   - Section 4: ACL ABI & registration function
   - Section 7: FHE operations & types
   - Section 8: Gas costs & optimization

4. **LOW (Reference as needed)**
   - Error codes & debugging
   - SDK changelog
   - Etherscan integration

---

## Checklist for Final Integration

Once you've gathered all Zama docs:

- [ ] All RPC/endpoint URLs confirmed
- [ ] SDK API exact function signatures documented
- [ ] Contract addresses (ACL, Verifier) on Sepolia
- [ ] Relayer endpoint working (local or Zama-hosted)
- [ ] Key generation tested in browser
- [ ] Request/response formats validated
- [ ] Authentication (API keys if needed) configured
- [ ] Error handling implemented for all API calls
- [ ] Gas costs estimated for deployment
- [ ] Testnet ETH received from faucet
- [ ] All .env variables filled in
- [ ] Ready for integration phase

---

## Resources

### Zama Official Links

- **Main Docs:** https://docs.zama.ai
- **FHEVM Docs:** https://docs.zama.ai/fhevm
- **GitHub:** https://github.com/zama-ai/fhevm
- **Community Discord:** https://discord.gg/ZkE4GkSKsq
- **Developer Portal:** https://www.zama.ai/developer

### Other Helpful Links

- **Sepolia Faucet:** https://www.infura.io/faucet/sepolia
- **Sepolia Etherscan:** https://sepolia.etherscan.io
- **JSON-RPC Calls:** https://ethereum.org/en/developers/docs/apis/json-rpc/

---

## Notes

- **Local Testing:** We've built `worker/relayerStub.js` to mock Zama relayer locally. This doesn't require Zama docs but helps you test without connecting to Zama services immediately.

- **Model 1 vs Model 2:** This checklist works for both models. Model 1 (encrypted result) requires more info on key handling; Model 2 (relayer-signed) requires more on signature verification.

- **Version Pinning:** Zama SDK may have breaking changes. Pin the version in `package.json` and document it.

- **Community Help:** If docs are unclear, ask in Zama Discord — developers actively monitor and help.

---

**Last Updated:** November 22, 2025  
**Status:** Ready for Zama docs gathering  
**Next Step:** Fetch URLs and fill in this checklist systematically
