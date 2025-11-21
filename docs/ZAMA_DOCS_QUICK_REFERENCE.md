# Zama Documentation Quick Reference

**Quick lookup:** Where to find each piece of information in Zama docs.

---

## 1. Network & RPC Configuration

| What | Where | Look For |
|------|-------|----------|
| **Sepolia RPC URL** | https://docs.zama.ai/fhevm/getting-started | "Sepolia Testnet", "Network Configuration", "RPC" |
| **Chain ID** | Standard (not in Zama docs) | 11155111 (Sepolia) |
| **Network Name** | Standard (not in Zama docs) | "Sepolia" or "Ethereum Testnet" |
| **Block Time** | Standard Ethereum docs | ~12 seconds |
| **Gas Token** | Standard Ethereum | Sepolia ETH (from faucet) |

**Action:** Check Zama homepage for "Sepolia" or "Testnet" banner with RPC endpoint.

---

## 2. SDK Installation

| What | Where | Look For |
|------|-------|----------|
| **Package Name** | https://www.npmjs.com or Zama docs | "npm install" or "Installation" |
| **Package Version** | npm package page | Latest version tag |
| **CDN URL** | jsDelivr or Unpkg | `https://cdn.jsdelivr.net/npm/@zama/...` |
| **GitHub Repo** | https://github.com/zama-ai/fhevm | Source code & releases |
| **Installation Steps** | https://docs.zama.ai/fhevm/installation | "Getting Started", "Setup" |

**Action:** Run `npm search @zama` or visit https://www.npmjs.com to find exact package.

---

## 3. SDK API Reference

| What | Where | Look For |
|------|-------|----------|
| **API Docs** | https://docs.zama.ai/fhevm/api | "API Reference", "Methods", "Functions" |
| **createFhevmInstance()** | API Reference | Search for "createFhevmInstance" or "instance creation" |
| **initSDK()** | API Reference | Search for "initSDK" or "initialization" |
| **encrypt()** | API Reference | Search for "encrypt", "encryption", "encryptWithPublicKey" |
| **decrypt()** | API Reference | Search for "decrypt", "decryption", "local decryption" |
| **generateKeys()** | API Reference | Search for "generateKeys", "key generation", "createKeyPair" |
| **Full Examples** | https://docs.zama.ai/fhevm/tutorials or GitHub | Look for "Examples", "Tutorials", "Sample Code" |

**Action:** Start at https://docs.zama.ai/fhevm/api and systematically document each function.

---

## 4. ACL & Contract Addresses

| What | Where | Look For |
|------|-------|----------|
| **ACL Address (Sepolia)** | https://docs.zama.ai/fhevm/networks or Etherscan | "Sepolia Deployment", "ACL", "0x..." |
| **Verifier Address (Sepolia)** | Same as above | "Verifier", "Input Verifier", "0x..." |
| **ACL ABI** | GitHub repo or npm package | `abi/ACL.json` or in docs |
| **ACL Registration Function** | ABI or docs | Function signature for registration |
| **Registration Example** | https://docs.zama.ai/fhevm/tutorials | "Registering in ACL", "registerAcl" |

**Action:** Visit Sepolia explorer and search for "ACL" to find address, then verify against docs.

**Helpful:** https://sepolia.etherscan.io (search "ACL" or "Zama")

---

## 5. Relayer Service

| What | Where | Look For |
|------|-------|----------|
| **Relayer Endpoint** | https://docs.zama.ai/fhevm/relayer or services page | "Relayer", "Service", "Endpoint", "https://..." |
| **API Documentation** | Same as above | "POST /evaluate", "Request Format", "Response Format" |
| **Authentication** | Relayer docs | "API Key", "Authorization", "Authentication" |
| **Error Codes** | Relayer docs | "Errors", "Status Codes", "Troubleshooting" |
| **Rate Limits** | Relayer docs | "Rate Limiting", "Quota", "Limits" |
| **Timeout/Performance** | Relayer docs | "Performance", "Timeout", "Evaluation Time" |

**Action:** Check if Zama publishes a hosted relayer endpoint or if we must run our own.

---

## 6. Key Management & TFHE

| What | Where | Look For |
|------|-------|----------|
| **Key Generation** | https://docs.zama.ai/fhevm/key-generation or tutorials | "Generate Keys", "Key Pair", "Setup" |
| **Key Format** | API Reference or examples | "Public Key Format", "Private Key Format", "Serialization" |
| **Storage Best Practices** | Security or key management docs | "Storage", "Security", "Best Practices", "localStorage" |
| **Local Decryption Support** | Privacy/Model docs | "Local Decryption", "Model 1", "User-Side Decryption" |
| **Key Rotation** | Security docs | "Key Rotation", "Expiration", "Refresh" |

**Action:** Look for "Key Management" or "Security" sections in Zama FHEVM docs.

---

## 7. FHE Operations & Types

| What | Where | Look For |
|------|-------|----------|
| **Supported Operations** | https://docs.zama.ai/fhevm/operators or Solidity guide | "Operators", "Supported Operations", "+", "-", "*", ">", "<" |
| **Encrypted Types** | Same as above | "ebool", "euint8", "euint16", "euint32", "euint64" |
| **Solidity FHE** | https://docs.zama.ai/fhevm/solidity | "FHE in Solidity", "Writing FHE Contracts" |
| **Example Programs** | GitHub or tutorials | "Example", "Sample FHE Program", "Tutorial" |
| **Performance Notes** | Operators or optimization docs | "Performance", "Gas Cost", "Optimization Tips" |

**Action:** Review "Operators" documentation to understand what scoring logic we can implement.

---

## 8. Deployment & Testing

| What | Where | Look For |
|------|-------|----------|
| **Deployment Steps** | https://docs.zama.ai/fhevm/deployment or hardhat integration | "Deploy", "Hardhat", "Deployment Script" |
| **Hardhat Integration** | Zama GitHub or npm | "hardhat-fhevm" plugin or similar |
| **Sepolia Faucet** | Not Zama docs | https://www.infura.io/faucet/sepolia |
| **Gas Costs** | Deployment or optimization docs | "Gas", "Costs", "Fee Estimation" |
| **Local Testing** | https://docs.zama.ai/fhevm/local-network or tutorials | "Local Network", "Hardhat Node", "Testing Locally" |
| **Testnet Monitoring** | Sepolia Etherscan | https://sepolia.etherscan.io |

**Action:** Check Zama docs for "Local Setup" or "Testing" to understand local dev flow.

---

## Quick Navigation Map

```
https://docs.zama.ai
├── /fhevm/getting-started
│   ├── Installation & Setup
│   ├── Network Configuration (Sepolia RPC)
│   └── Tutorials
├── /fhevm/api
│   ├── createFhevmInstance()
│   ├── initSDK()
│   ├── encrypt()
│   ├── decrypt()
│   └── generateKeys()
├── /fhevm/operators
│   ├── Supported Operations
│   ├── Encrypted Types (ebool, euint32, etc.)
│   └── Performance Notes
├── /fhevm/solidity
│   ├── FHE in Smart Contracts
│   └── Examples
├── /fhevm/relayer
│   ├── Endpoint Configuration
│   ├── API Reference
│   └── Authentication
├── /fhevm/networks
│   ├── ACL Address (Sepolia)
│   ├── Verifier Address (Sepolia)
│   └── Contract ABI
├── /fhevm/deployment
│   ├── Deployment Steps
│   ├── Hardhat Integration
│   └── Optimization
└── /fhevm/troubleshooting
    ├── Common Errors
    └── Debugging Tips
```

---

## Information Gathering Workflow

### Step 1: Start Simple (5 min)

1. Open: https://docs.zama.ai/fhevm
2. Look for "Sepolia" or "Testnet" info
3. Note: RPC URL, ACL address, Verifier address
4. Copy to `ZAMA_DOCS_GATHERING.md` Section 1 & 4

### Step 2: SDK & Installation (10 min)

1. Find: "Installation" or "Getting Started"
2. Note: npm package name and version
3. Check: CDN availability (if any)
4. Copy to `ZAMA_DOCS_GATHERING.md` Section 2

### Step 3: API Reference (20 min)

1. Navigate: https://docs.zama.ai/fhevm/api
2. For each function, document:
   - Exact name
   - Parameters (type, required/optional)
   - Return type
   - Example usage
3. Copy to `ZAMA_DOCS_GATHERING.md` Section 3

### Step 4: Relayer Service (15 min)

1. Find: https://docs.zama.ai/fhevm/relayer or services page
2. Document:
   - Endpoint URL
   - Request format (JSON structure)
   - Response format
   - Authentication (if any)
3. Copy to `ZAMA_DOCS_GATHERING.md` Section 5

### Step 5: Key Management (10 min)

1. Find: Key generation & storage info
2. Document:
   - Generation function
   - Key format (structure)
   - Storage recommendations
   - Decryption support
3. Copy to `ZAMA_DOCS_GATHERING.md` Section 6

### Step 6: FHE Operations (10 min)

1. Find: "Operators" documentation
2. Document:
   - Available operations list
   - Encrypted type names
   - Example threshold check
3. Copy to `ZAMA_DOCS_GATHERING.md` Section 7

### Step 7: Testing & Deployment (10 min)

1. Find: Local setup & testnet info
2. Document:
   - Local dev flow
   - Deployment steps
   - Faucet link (for ETH)
3. Copy to `ZAMA_DOCS_GATHERING.md` Section 8

**Total Time:** ~80 minutes for complete gathering

---

## FAQ: Where's This Info?

**Q: I can't find Sepolia RPC URL in Zama docs.**  
A: It might be on the main website banner or GitHub. Worst case, use standard Sepolia RPC (Infura, Alchemy).

**Q: The API reference is incomplete.**  
A: Check GitHub examples and source code. SDK may have TypeScript definitions (.d.ts files) in npm.

**Q: No relayer endpoint listed.**  
A: Zama may provide docs for running your own. We've built `worker/relayerStub.js` for local testing.

**Q: SDK version keeps changing.**  
A: Pin the version in `package.json`. Check changelog for breaking changes between versions.

**Q: Can't find ACL address.**  
A: Search Sepolia Etherscan for "ACL" or "Zama". Or ask in Zama Discord.

---

## Tools to Help

- **Zama GitHub:** https://github.com/zama-ai/fhevm
- **npm Package:** https://www.npmjs.com (search "@zama")
- **Sepolia Explorer:** https://sepolia.etherscan.io
- **JSON Formatter:** Paste raw JSON to validate structure
- **cURL Tester:** Test relayer endpoint offline
- **Zama Discord:** https://discord.gg/ZkE4GkSKsq (community help)

---

## Once You've Gathered Everything

1. Fill in `ZAMA_DOCS_GATHERING.md` completely
2. Update `.env` with all gathered values
3. Update `apps/web/src/lib/fhevmConfig.ts` with exact API calls
4. Test each component (RPC, SDK, ACL, relayer)
5. Update `docs/INTEGRATION_GUIDE.md` with gathered API signatures
6. Run 5-terminal local setup to validate

---

**Created:** November 22, 2025  
**Purpose:** Quick reference for gathering Zama documentation  
**Related File:** `ZAMA_DOCS_GATHERING.md` (detailed checklist)
