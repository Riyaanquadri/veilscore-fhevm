// src/lib/zama.ts
// Placeholder integration points for Zama TFHE client APIs.
// Replace simulate* with real encryption + FHE evaluation.

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

export async function encryptWithTFHE(normalized: NormalizedInputs): Promise<{
  ciphertext: Uint8Array;
  commitment: string;
}> {
  const encoder = new TextEncoder();
  const payload = JSON.stringify(normalized);
  const ciphertext = encoder.encode(payload);

  let commitment = "0x" + "0".repeat(64);
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const digest = await crypto.subtle.digest("SHA-256", encoder.encode(payload));
      commitment = `0x${bufferToHex(digest)}`;
    } else {
      throw new Error("crypto.subtle is unavailable in this environment");
    }
  } catch (err) {
    console.warn("Failed to derive cryptographic commitment, falling back to hash placeholder", err);
    const slice = ciphertext.length >= 32 ? ciphertext.slice(0, 32) : ciphertext;
    const sliceBuffer = slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength);
    const fallbackHex = bufferToHex(sliceBuffer).padEnd(64, "0");
    commitment = `0x${fallbackHex}`;
  }

  return { ciphertext, commitment };
}

export async function callFHECompute(ciphertext: Uint8Array): Promise<{
  encryptedScore: Uint8Array;
  allowed: boolean;
}> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let allowed = false;
  let encryptedScore = ciphertext;

  try {
    const normalized = JSON.parse(decoder.decode(ciphertext)) as NormalizedInputs;
    const aggregateScore = normalized.followers + normalized.txCount;
    allowed = normalized.bracket <= 2; // Allow Silver, Gold, Diamond tiers
    const resultPayload = JSON.stringify({ aggregateScore, bracket: normalized.bracket });
    encryptedScore = encoder.encode(resultPayload);
  } catch (err) {
    console.error("Failed to decrypt ciphertext for evaluation", err);
    allowed = false;
  }

  return { encryptedScore, allowed };
}
