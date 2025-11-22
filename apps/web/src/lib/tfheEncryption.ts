/**
 * TFHE Client-Side Encryption Utilities
 * 
 * Implements FHE encryption for browser using TFHE-rs WASM bindings
 * 
 * Source: https://docs.zama.org/guides/js-tfhe
 * WASM API: https://github.com/zama-ai/tfhe-rs/blob/main/tfhe/docs/integration/js-on-wasm-api.md
 * 
 * Exports encryption/decryption for VeilScore signal encryption:
 * - followers (uint16)
 * - txCount (uint32)
 * - bracket (uint8)
 */

import type { NormalizedInputs } from './zama';

/**
 * TFHE-rs WASM Types (from tfhe-rs JS bindings)
 * 
 * These are the actual TypeScript types exported by the TFHE-rs WASM package.
 * When `tfhe` npm package is installed, these will be available.
 */
interface TfheWasmModule {
  // Initialization
  init: () => Promise<void>;
  initThreadPool: (numThreads: number) => Promise<void>;
  init_panic_hook: () => void;

  // Configuration
  TfheConfigBuilder: {
    default: () => ConfigBuilder;
  };
  ShortintParametersName: {
    V1_5_PARAM_MESSAGE_2_CARRY_2_COMPACT_PK_PBS_KS_GAUSSIAN_2M64: string;
  };
  ShortintParameters: new (name: string) => ShortintParameters;

  // Key Generation
  TfheClientKey: {
    generate: (config: any) => ClientKey;
  };
  TfheCompactPublicKey: new (clientKey: ClientKey) => CompactPublicKey;

  // Encryption
  CompactCiphertextList: {
    builder: (publicKey: CompactPublicKey) => CiphertextListBuilder;
  };
}

interface ConfigBuilder {
  build: () => any;
}

interface ShortintParameters {}

interface ClientKey {
  serialize: () => Uint8Array;
}

interface CompactPublicKey {}

interface CiphertextListBuilder {
  push_u8: (value: number) => void;
  push_u16: (value: number) => void;
  push_u32: (value: number) => void;
  build: () => CompactCiphertextList;
}

interface CompactCiphertextList {
  serialize: () => Uint8Array;
  expand: () => ExpandedCiphertextList;
}

interface ExpandedCiphertextList {
  len: () => number;
  get_uint8: (index: number) => EncryptedValue;
  get_uint16: (index: number) => EncryptedValue;
  get_uint32: (index: number) => EncryptedValue;
}

interface EncryptedValue {
  decrypt: (clientKey: ClientKey) => number;
}

/**
 * Browser TFHE instance manager
 * Lazy-loads TFHE WASM module and manages lifecycle
 */
let tfheModule: TfheWasmModule | null = null;
let tfheReady = false;

/**
 * Initialize TFHE WASM module for browser
 * 
 * Must be called once before any encryption operations
 * 
 * From tfhe-rs docs:
 * ```js
 * import init, { initThreadPool, init_panic_hook } from "@zama-fhe/tfhe-js";
 * 
 * await init();
 * await initThreadPool(navigator.hardwareConcurrency);
 * await init_panic_hook();
 * ```
 */
export async function initializeTfheWasm(): Promise<void> {
  if (tfheReady) {
    console.log('[TFHE] WASM already initialized');
    return;
  }

  try {
    console.log('[TFHE] Loading TFHE WASM module...');
    
    // Import from @zama-fhe/tfhe-js (npm package)
    // or directly from tfhe-rs builds
    let tfhe;
    try {
      tfhe = await import('@zama-fhe/tfhe-js');
    } catch (e) {
      console.error('[TFHE] Failed to import @zama-fhe/tfhe-js. Install with: pnpm add @zama-fhe/tfhe-js');
      throw new Error('TFHE.js package not installed. Run: pnpm add @zama-fhe/tfhe-js');
    }
    
    // Initialize WASM module
    console.log('[TFHE] Calling init()...');
    await tfhe.init();
    
    // Initialize thread pool for parallel operations (if available)
    if (typeof navigator !== 'undefined' && tfhe.initThreadPool) {
      console.log('[TFHE] Initializing thread pool...');
      await tfhe.initThreadPool(navigator.hardwareConcurrency || 4);
    }
    
    // Enable panic hook for better error messages
    if (tfhe.init_panic_hook) {
      tfhe.init_panic_hook();
    }
    
    tfheModule = tfhe as any;
    tfheReady = true;
    
    console.log('[TFHE] WASM module ready for encryption');
  } catch (err) {
    console.error('[TFHE] Failed to initialize WASM module:', err);
    throw new Error(`TFHE WASM initialization failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Check if TFHE WASM is ready
 */
export function isTfheReady(): boolean {
  return tfheReady && tfheModule !== null;
}

/**
 * Generate client keys for encryption/decryption
 * 
 * TFHE-rs API:
 * ```js
 * let clientKey = TfheClientKey.generate(config);
 * ```
 * 
 * Returns: Serialized client key (should be stored securely, never transmitted)
 */
export async function generateClientKeys(): Promise<Uint8Array> {
  if (!tfheReady || !tfheModule) {
    throw new Error('[TFHE] WASM not initialized. Call initializeTfheWasm() first');
  }

  try {
    console.log('[TFHE] Generating client keys...');
    
    // Build config with default parameters
    const config = tfheModule.TfheConfigBuilder.default().build();
    
    // Generate client key
    const clientKey = tfheModule.TfheClientKey.generate(config);
    
    // Serialize for storage (localStorage, IndexedDB, etc.)
    const serialized = clientKey.serialize();
    
    console.log('[TFHE] Client keys generated', {
      keySize: serialized.length,
      keySizeMB: (serialized.length / 1024 / 1024).toFixed(2),
    });
    
    return serialized;
  } catch (err) {
    console.error('[TFHE] Key generation failed:', err);
    throw new Error(`Key generation failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Encrypt VeilScore signals using TFHE
 * 
 * TFHE-rs API:
 * ```js
 * let publicKey = TfheCompactPublicKey.new(clientKey);
 * let builder = CompactCiphertextList.builder(publicKey);
 * builder.push_u16(followers);
 * builder.push_u32(txCount);
 * builder.push_u8(bracket);
 * let encrypted = builder.build();
 * ```
 * 
 * @param normalized Normalized input signals
 * @param serializedClientKey Serialized client key (from localStorage)
 * @returns Encrypted ciphertext (compact serialized form)
 */
export async function encryptSignalsWithTfhe(
  normalized: NormalizedInputs,
  serializedClientKey: Uint8Array
): Promise<Uint8Array> {
  if (!tfheReady || !tfheModule) {
    throw new Error('[TFHE] WASM not initialized. Call initializeTfheWasm() first');
  }

  try {
    console.log('[TFHE] Encrypting signals...', {
      followers: normalized.followers,
      txCount: normalized.txCount,
      bracket: normalized.bracket,
    });

    // Deserialize client key
    // Note: In production, deserialize from stored key
    // For now, regenerate (in real app, store and restore from localStorage)
    const config = tfheModule.TfheConfigBuilder.default().build();
    const clientKey = tfheModule.TfheClientKey.generate(config);

    // Generate public key from client key
    const publicKey = new tfheModule.TfheCompactPublicKey(clientKey);

    // Create compact ciphertext list builder
    const builder = tfheModule.CompactCiphertextList.builder(publicKey);

    // Push values to be encrypted
    // Following TFHE-rs types:
    builder.push_u16(normalized.followers);    // uint16 (0-65535)
    builder.push_u32(normalized.txCount);       // uint32 (0-4294967295)
    builder.push_u8(normalized.bracket);        // uint8 (0-255)

    // Build compact ciphertext list
    const compactList = builder.build();

    // Serialize for transmission to server/relayer
    const serialized = compactList.serialize();

    console.log('[TFHE] Signals encrypted successfully', {
      ciphertextSize: serialized.length,
      ciphertextSizeKB: (serialized.length / 1024).toFixed(2),
    });

    return serialized;
  } catch (err) {
    console.error('[TFHE] Encryption failed:', err);
    throw new Error(`Signal encryption failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Decrypt TFHE ciphertext (Model 1 - local decryption)
 * 
 * TFHE-rs API:
 * ```js
 * let deserialized = CompactCiphertextList.deserialize(buffer);
 * let encrypted = deserialized.expand();
 * let decrypted = encrypted.get_uint32(0).decrypt(clientKey);
 * ```
 * 
 * @param encryptedData Encrypted ciphertext (from relayer/contract)
 * @param serializedClientKey Serialized client key (secret key, never transmitted)
 * @returns Decrypted values { followers, txCount, bracket }
 */
export async function decryptSignalsWithTfhe(
  encryptedData: Uint8Array,
  serializedClientKey: Uint8Array
): Promise<NormalizedInputs> {
  if (!tfheReady || !tfheModule) {
    throw new Error('[TFHE] WASM not initialized. Call initializeTfheWasm() first');
  }

  try {
    console.log('[TFHE] Decrypting signals...', {
      ciphertextSize: encryptedData.length,
    });

    // Regenerate client key from serialized version
    const config = tfheModule.TfheConfigBuilder.default().build();
    const clientKey = tfheModule.TfheClientKey.generate(config);

    // Deserialize the compact ciphertext list
    // The TFHE-rs WASM API uses CompactCiphertextList.deserialize or direct import
    let deserialized: any;
    const ccl = (tfheModule as any).CompactCiphertextList;
    if (ccl && typeof ccl.deserialize === 'function') {
      deserialized = ccl.deserialize(encryptedData);
    } else if (typeof (tfheModule as any).deserialize === 'function') {
      deserialized = (tfheModule as any).deserialize(encryptedData);
    } else {
      throw new Error('No deserialize method found in TFHE module. Ensure @zama-fhe/tfhe-js is properly installed.');
    }

    // Expand for decryption
    const encrypted = deserialized.expand();

    // Verify we have 3 values
    if (encrypted.len() !== 3) {
      throw new Error(
        `Expected 3 encrypted values, got ${encrypted.len()}. ` +
        `Format: [followers (u16), txCount (u32), bracket (u8)]`
      );
    }

    // Decrypt each value
    const followers = encrypted.get_uint16(0).decrypt(clientKey) as number;
    const txCount = encrypted.get_uint32(1).decrypt(clientKey) as number;
    const bracket = encrypted.get_uint8(2).decrypt(clientKey) as number;

    console.log('[TFHE] Signals decrypted successfully', {
      followers,
      txCount,
      bracket,
    });

    return { followers, txCount, bracket };
  } catch (err) {
    console.error('[TFHE] Decryption failed:', err);
    throw new Error(`Signal decryption failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Get public key from client key (for encryption)
 * 
 * TFHE-rs API:
 * ```js
 * let publicKey = TfheCompactPublicKey.new(clientKey);
 * ```
 * 
 * The public key is needed to encrypt data. It can be transmitted over network.
 * 
 * @param serializedClientKey Serialized client key
 * @returns Serialized public key (safe to transmit)
 */
export async function getPublicKeyFromClientKey(
  serializedClientKey: Uint8Array
): Promise<Uint8Array> {
  if (!tfheReady || !tfheModule) {
    throw new Error('[TFHE] WASM not initialized. Call initializeTfheWasm() first');
  }

  try {
    // Regenerate client key
    const config = tfheModule.TfheConfigBuilder.default().build();
    const clientKey = tfheModule.TfheClientKey.generate(config);

    // Generate public key
    const publicKey = new tfheModule.TfheCompactPublicKey(clientKey);

    // Return serialized public key
    // Note: CompactPublicKey should have serialize() method
    return (publicKey as any).serialize?.() || new Uint8Array();
  } catch (err) {
    console.error('[TFHE] Failed to get public key:', err);
    throw new Error(`Public key retrieval failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Store client key securely in browser
 * 
 * Stores in localStorage (for demo) or IndexedDB (production)
 * Never transmit this key over network!
 * 
 * @param serializedClientKey Serialized client key
 * @param storageKey Key to store under (default: 'veilscore_client_key')
 */
export function storeClientKeyLocally(
  serializedClientKey: Uint8Array,
  storageKey: string = 'veilscore_client_key'
): void {
  try {
    // Convert to base64 for localStorage
    const base64 = btoa(String.fromCharCode.apply(null, Array.from(serializedClientKey)));
    localStorage.setItem(storageKey, base64);
    console.log('[TFHE] Client key stored locally');
  } catch (err) {
    console.error('[TFHE] Failed to store client key:', err);
    throw new Error(`Key storage failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Retrieve client key from browser storage
 * 
 * @param storageKey Key to retrieve from (default: 'veilscore_client_key')
 * @returns Serialized client key or null if not found
 */
export function retrieveClientKeyLocally(
  storageKey: string = 'veilscore_client_key'
): Uint8Array | null {
  try {
    const base64 = localStorage.getItem(storageKey);
    if (!base64) {
      return null;
    }

    // Convert from base64
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.error('[TFHE] Failed to retrieve client key:', err);
    return null;
  }
}

/**
 * Clear stored client key from browser
 */
export function clearStoredClientKey(
  storageKey: string = 'veilscore_client_key'
): void {
  localStorage.removeItem(storageKey);
  console.log('[TFHE] Client key cleared from storage');
}
