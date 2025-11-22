/**
 * src/lib/zama.ts
 * 
 * TFHE signal normalization and encryption orchestration
 * 
 * Integration with TFHE-rs WASM for:
 * 1. Signal normalization (followers, txCount → uint16, uint32)
 * 2. Client-side encryption (TFHE)
 * 3. Commitment generation (SHA-256)
 * 
 * Source: https://github.com/zama-ai/tfhe-rs
 * WASM API: https://docs.zama.org/guides/js-tfhe
 */

import {
  initializeTfheWasm,
  isTfheReady,
  generateClientKeys,
  encryptSignalsWithTfhe,
  storeClientKeyLocally,
  retrieveClientKeyLocally,
} from './tfheEncryption';

export type NormalizedInputs = {
  followers: number;
  txCount: number;
  bracket: number;
};

export async function normalizeInputs(inputs: { followers: number; txCount: number }): Promise<NormalizedInputs> {
  const normalizedFollowers = Math.min(65535, Math.round(inputs.followers / 10));
  const normalizedTx = Math.min(65535, Math.round(inputs.txCount));

  let bracket = 4; // default unranked
  if (inputs.followers > 5000 && inputs.txCount > 5000) {
    bracket = 0; // Diamond
  } else if (inputs.followers > 1000 && inputs.txCount > 1000) {
    bracket = 1; // Gold
  } else if (inputs.followers > 500 && inputs.txCount > 500) {
    bracket = 2; // Silver
  } else if (inputs.followers > 100 && inputs.txCount > 100) {
    bracket = 3; // Bronze
  }

  return {
    followers: normalizedFollowers,
    txCount: normalizedTx,
    bracket,
  };
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Encrypt normalized inputs using TFHE-rs WASM
 * 
 * Flow:
 * 1. Initialize TFHE WASM (if needed)
 * 2. Generate or retrieve client keys
 * 3. Encrypt signals: followers (u16) + txCount (u32) + bracket (u8)
 * 4. Create commitment hash
 * 5. Return encrypted data + commitment
 * 
 * From TFHE-rs docs:
 * ```js
 * let publicKey = TfheCompactPublicKey.new(clientKey);
 * let builder = CompactCiphertextList.builder(publicKey);
 * builder.push_u16(value);
 * let encrypted = builder.build();
 * let serialized = encrypted.serialize();
 * ```
 */
export async function encryptWithTFHE(normalized: NormalizedInputs): Promise<{
  ciphertext: Uint8Array;
  commitment: string;
}> {
  try {
    // Step 1: Initialize TFHE WASM if not already done
    if (!isTfheReady()) {
      console.log('[Zama] Initializing TFHE WASM module...');
      await initializeTfheWasm();
    }

    // Step 2: Generate or retrieve client keys
    let clientKey = retrieveClientKeyLocally();
    if (!clientKey) {
      console.log('[Zama] Generating new client keys...');
      clientKey = await generateClientKeys();
      storeClientKeyLocally(clientKey);
    }

    // Step 3: Encrypt signals using TFHE-rs
    console.log('[Zama] Encrypting signals with TFHE...', normalized);
    const ciphertext = await encryptSignalsWithTfhe(normalized, clientKey);

    // Step 4: Create commitment (SHA-256 hash of plaintext)
    const encoder = new TextEncoder();
    const payload = JSON.stringify(normalized);
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(payload));
    const commitment = `0x${Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;

    console.log('[Zama] Encryption complete', {
      ciphertextSize: ciphertext.length,
      commitment,
    });

    return { ciphertext, commitment };
  } catch (err) {
    console.error('[Zama] Encryption failed:', err);
    throw new Error(`TFHE encryption failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function callFHECompute(ciphertext: Uint8Array): Promise<{
  encryptedScore: Uint8Array;
  allowed: boolean;
}> {
  /**
   * TODO: Integrate with actual FHE computation
   * 
   * This is currently a placeholder that attempts to parse encrypted data.
   * In production, this should:
   * 
   * Option A: Send to Relayer (Model 2 - relayer-signed)
   *   - POST encrypted ciphertext to https://relayer.testnet.zama.org/v1/input-proof
   *   - Receive computed result + signature
   *   - Verify signature
   *   - Return allowed boolean
   * 
   * Option B: Send to FHE Smart Contract (Model 1 - encrypted)
   *   - POST encrypted ciphertext to contract via submitWithSig()
   *   - Contract uses FHE precompiles to compute encrypted score
   *   - Contract returns allowed boolean + commitment
   * 
   * References:
   * - Relayer API: https://docs.zama.org/guides/relayer-sdk
   * - FHE Smart Contracts: https://docs.zama.org/fhevm/guides
   */
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let allowed = false;
  let encryptedScore = ciphertext;

  try {
    // For now: simulate by parsing plaintext (not actual FHE)
    const normalized = JSON.parse(decoder.decode(ciphertext)) as NormalizedInputs;
    const aggregateScore = normalized.followers + normalized.txCount;
    allowed = normalized.bracket <= 2; // Allow Silver, Gold, Diamond tiers
    const resultPayload = JSON.stringify({ aggregateScore, bracket: normalized.bracket });
    encryptedScore = encoder.encode(resultPayload);
  } catch (err) {
    console.error('[Zama] FHE evaluation failed', err);
    allowed = false;
  }

  return { encryptedScore, allowed };
}
