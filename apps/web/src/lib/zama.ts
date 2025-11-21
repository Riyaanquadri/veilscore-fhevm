// src/lib/zama.ts
// Placeholder integration points for Zama TFHE client APIs.
// Replace simulate* with real encryption + FHE evaluation.

export type NormalizedInputs = {
  followers: number;
  txCount: number;
  inboundEth: number;
  bracket: number;
};

export async function normalizeInputs(inputs: {
  followers: number;
  txCount: number;
  inboundEth: number;
  bracket: number;
}): Promise<NormalizedInputs> {
  return {
    followers: Math.min(65535, Math.round(inputs.followers / 10)),
    txCount: Math.min(65535, Math.round(inputs.txCount)),
    inboundEth: Math.min(65535, Math.round(inputs.inboundEth * 1000)),
    bracket: inputs.bracket ? 1 : 0,
  };
}

export async function encryptWithTFHE(normalized: NormalizedInputs): Promise<{
  ciphertext: Uint8Array;
  commitment: string;
}> {
  // TODO: call Zama's client-side encryption API.
  const ciphertext = new Uint8Array([1, 2, 3]);
  const commitment = "0x" + "a".repeat(64);
  return { ciphertext, commitment };
}

export async function callFHECompute(ciphertext: Uint8Array): Promise<{
  encryptedScore: Uint8Array;
  allowed: boolean;
}> {
  // TODO: integrate with an FHE runtime / FHEVM node.
  const encryptedScore = new Uint8Array([4, 5, 6]);
  const allowed = true;
  return { encryptedScore, allowed };
}
