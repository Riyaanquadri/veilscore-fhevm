/**
 * Local Relayer Stub for VeilScore Testing
 *
 * Simulates Zama relayer evaluation without network roundtrips.
 * Useful for rapid iteration and testing before Sepolia deployment.
 *
 * Usage:
 *   node worker/relayerStub.js
 *   Then set VITE_FHEVM_RELAYER_URL=http://localhost:3000 in frontend
 */

const express = require("express");
const { ethers } = require("ethers");

const app = express();
app.use(express.json());

/**
 * Mock relayer signer
 * ⚠️ WARNING: For testing only! Never use in production.
 */
const RELAYER_PRIVATE_KEY = process.env.RELAYER_TEST_KEY ||
  "0x0000000000000000000000000000000000000000000000000000000000000001";
const relayerSigner = new ethers.Wallet(RELAYER_PRIVATE_KEY);

console.log("🚀 Local Relayer Stub Starting");
console.log(`   Relayer Address: ${relayerSigner.address}`);
console.log(`   Private Key: ${RELAYER_PRIVATE_KEY.slice(0, 10)}... (TESTING ONLY)`);
console.log("");

/**
 * POST /api/evaluate
 *
 * Simulates FHEVM FHE evaluation inside the relayer.
 * In production, this calls the actual Zama FHE precompile.
 *
 * Request:
 *   {
 *     "encryptedInput": "0x...",
 *     "userAddress": "0x...",
 *     "inputProof": {...}  // optional
 *   }
 *
 * Response (Model 2: Relayer-Signed):
 *   {
 *     "commitment": "0x...",
 *     "allowed": true/false,
 *     "signature": "0x...",
 *     "relayerAddress": "0x..."
 *   }
 *
 * For Model 1 (Encrypted result), return:
 *   {
 *     "encryptedResult": "0x...",
 *     "relayerAddress": "0x..."
 *   }
 */
app.post("/api/evaluate", async (req, res) => {
  try {
    const { encryptedInput, userAddress } = req.body;

    if (!encryptedInput) {
      return res.status(400).json({ error: "Missing encryptedInput" });
    }

    // Simulate FHE computation
    // In production, this would:
    // 1. Decrypt encryptedInput inside FHEVM
    // 2. Run FHE operations on plaintext
    // 3. Evaluate bracket/threshold logic
    // 4. Return encrypted result or plaintext + signature
    //
    // For now, we mock it deterministically based on input hash
    const inputHash = ethers.keccak256(encryptedInput);
    const mockAllowed = parseInt(inputHash.slice(2, 10), 16) % 2 === 0;

    // Model 2: Relayer signs plaintext result
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "bytes32", "bool"],
      [userAddress || ethers.ZeroAddress, inputHash, mockAllowed]
    );

    // Sign with relayer key
    const signature = await relayerSigner.signMessage(
      ethers.getBytes(messageHash)
    );

    console.log(`✓ Evaluated input: ${encryptedInput.slice(0, 10)}...`);
    console.log(`  Allowed: ${mockAllowed}`);
    console.log(`  Signature: ${signature.slice(0, 20)}...`);
    console.log("");

    // Response: plaintext result + relayer signature (Model 2)
    res.json({
      success: true,
      commitment: inputHash,
      allowed: mockAllowed,
      signature: signature,
      relayerAddress: relayerSigner.address,
      evaluatedAt: Math.floor(Date.now() / 1000),
      note: "This is a mock relayer stub for testing only"
    });
  } catch (error) {
    console.error("❌ Evaluation error:", error.message);
    res.status(500).json({
      error: error.message,
      note: "Local relayer stub encountered an error"
    });
  }
});

/**
 * GET /api/status
 * Health check endpoint
 */
app.get("/api/status", (req, res) => {
  res.json({
    status: "healthy",
    relayerAddress: relayerSigner.address,
    mode: "mock",
    note: "Local testing relayer stub"
  });
});

/**
 * GET /api/config
 * Return mock Sepolia config for the SDK
 */
app.get("/api/config", (req, res) => {
  res.json({
    chainId: 31337, // Hardhat network
    relayerAddress: relayerSigner.address,
    aclContractAddress: "0x2aebcdc4ef0eb9b2dc5bb75060f7e3a4b5d5c5b0",
    inputVerifierAddress: "0x0000000000000000000000000000000000000000",
    kmsVerifierAddress: "0x0000000000000000000000000000000000000000",
    note: "Mock configuration for local testing"
  });
});

/**
 * POST /api/encrypt
 * Mock encryption endpoint (optional)
 * In production, encryption happens client-side with client's public key
 */
app.post("/api/encrypt", (req, res) => {
  const { plaintext } = req.body;

  if (!plaintext) {
    return res.status(400).json({ error: "Missing plaintext" });
  }

  // Mock: just hash it (not real encryption!)
  const mockCiphertext = ethers.keccak256(ethers.toBeHex(plaintext));

  res.json({
    ciphertext: mockCiphertext,
    note: "Mock encryption for testing only"
  });
});

/**
 * POST /api/decrypt
 * Mock decryption endpoint (optional)
 * In production, decryption happens client-side with client's private key
 */
app.post("/api/decrypt", (req, res) => {
  const { ciphertext } = req.body;

  if (!ciphertext) {
    return res.status(400).json({ error: "Missing ciphertext" });
  }

  // Mock: can't actually decrypt without the key, just return success
  res.json({
    success: true,
    note: "Mock decryption endpoint (client should decrypt locally with private key)"
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`📡 Local Relayer Stub listening on http://localhost:${PORT}`);
  console.log("");
  console.log("Available endpoints:");
  console.log(`  POST   http://localhost:${PORT}/api/evaluate     - Evaluate encrypted input`);
  console.log(`  GET    http://localhost:${PORT}/api/status       - Health check`);
  console.log(`  GET    http://localhost:${PORT}/api/config       - Mock config`);
  console.log(`  POST   http://localhost:${PORT}/api/encrypt      - Mock encrypt`);
  console.log(`  POST   http://localhost:${PORT}/api/decrypt      - Mock decrypt`);
  console.log("");
  console.log("⚠️  This is a mock relayer for testing only.");
  console.log("    For production, use official Zama relayer: https://relayer.api.zama.ai");
  console.log("");
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down local relayer stub...");
  process.exit(0);
});
