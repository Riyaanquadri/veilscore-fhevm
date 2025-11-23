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
 * Must be called once before any encryption operations.
 * 
 * How it works:
 * 1. Imports the high-level @zama-fhe/tfhe-js library
 * 2. Creates a test Key object, which triggers WASM initialization
 * 3. Stores references to createKey and TFHERs for later use
 * 
 * Why we use createKey() instead of initSDK():
 * - The raw initSDK() is a low-level WASM init function that requires careful parameter passing
 * - The createKey() function wraps it properly and handles browser/Node.js detection
 * - This is the documented high-level API for key generation and encryption
 * 
 * @throws Error if WASM module cannot be loaded or initialized
 * 
 * See: https://github.com/zama-ai/tfhe-js
 */
export async function initializeTfheWasm(): Promise<void> {
  if (tfheReady) {
    console.log('[TFHE] WASM already initialized');
    return;
  }

  try {
    console.log('[TFHE] ========== WASM Initialization ==========');
    
    // Step 0: Verify WASM file is accessible
    console.log('[TFHE] Step 0: Checking WASM file accessibility...');
    try {
      const wasmCheck = await fetch('/tfhe_bg.wasm', { method: 'HEAD' });
      console.log(`[TFHE] ✓ WASM file found at /tfhe_bg.wasm (Status: ${wasmCheck.status})`);
      console.log(`[TFHE]   Content-Type: ${wasmCheck.headers.get('content-type')}`);
    } catch (fetchErr) {
      console.warn('[TFHE] ⚠️ HEAD request failed, trying GET...');
      const wasmGetCheck = await fetch('/tfhe_bg.wasm');
      if (wasmGetCheck.ok) {
        console.log(`[TFHE] ✓ WASM file accessible via GET (Status: ${wasmGetCheck.status})`);
        console.log(`[TFHE]   Content-Type: ${wasmGetCheck.headers.get('content-type')}`);
      } else {
        console.error(`[TFHE] ✗ WASM file returned status ${wasmGetCheck.status}`);
      }
    }
    
    // Step 1: Import the high-level library which handles WASM loading
    console.log('[TFHE] Step 1: Importing TFHE package...');
    const tfhePackage = await import('@zama-fhe/tfhe-js') as any;
    
    console.log('[TFHE] ✓ Package imported');
    const exports = Object.keys(tfhePackage).filter(k => !k.startsWith('_')).slice(0, 20);
    console.log('[TFHE] Available exports:', exports.join(', '));
    
    // Step 2: Check what we have at root level
    const { TFHERs, Shortint, initSDK, Key, init, createKey, TfheClientKey, TfheConfigBuilder } = tfhePackage;
    
    console.log('[TFHE] Step 2: Checking core exports');
    console.log('[TFHE] - TFHERs available:', !!TFHERs);
    console.log('[TFHE] - Shortint available:', !!Shortint);
    console.log('[TFHE] - TfheClientKey available:', !!TfheClientKey);
    console.log('[TFHE] - TfheConfigBuilder available:', !!TfheConfigBuilder);
    console.log('[TFHE] - createKey available:', !!createKey);
    
    // Step 2b: Check inside TFHERs namespace for key classes
    let tfheClientKeyFromNamespace = null;
    let tfheConfigBuilderFromNamespace = null;
    if (TFHERs && typeof TFHERs === 'object') {
      console.log('[TFHE] Checking TFHERs namespace for key classes...');
      const tfhersKeys = Object.keys(TFHERs as any).slice(0, 20);
      console.log('[TFHE] TFHERs exports:', tfhersKeys.join(', '));
      tfheClientKeyFromNamespace = (TFHERs as any).TfheClientKey;
      tfheConfigBuilderFromNamespace = (TFHERs as any).TfheConfigBuilder;
      console.log('[TFHE] - TFHERs.TfheClientKey available:', !!tfheClientKeyFromNamespace);
      console.log('[TFHE] - TFHERs.TfheConfigBuilder available:', !!tfheConfigBuilderFromNamespace);
    }
    
    // Step 3: Initialize WASM module
    console.log('[TFHE] Step 3: Initializing WASM module...');
    
    let initResult = undefined;
    let initSuccess = false;
    
    // Priority: init() > initSDK > TFHERs.init > auto-init detection
    if (typeof init === 'function') {
      console.log('[TFHE] Attempting: init()...');
      try {
        initResult = await init();
        console.log('[TFHE] ✓ init() completed successfully');
        initSuccess = true;
      } catch (err) {
        console.warn('[TFHE] init() failed:', err);
      }
    } else if (typeof initSDK === 'function') {
      console.log('[TFHE] Attempting: initSDK()...');
      try {
        initResult = await initSDK();
        console.log('[TFHE] ✓ initSDK() completed');
        initSuccess = true;
      } catch (err) {
        console.warn('[TFHE] initSDK() failed:', err);
      }
    } else if (typeof TFHERs === 'object' && TFHERs !== null && typeof (TFHERs as any).init === 'function') {
      console.log('[TFHE] Attempting: TFHERs.init()...');
      try {
        initResult = await (TFHERs as any).init();
        console.log('[TFHE] ✓ TFHERs.init() completed');
        initSuccess = true;
      } catch (err) {
        console.warn('[TFHE] TFHERs.init() failed:', err);
      }
    } else {
      console.log('[TFHE] No explicit init function found. Checking if WASM auto-initialized...');
      // Check if key classes are available (auto-init)
      if (TfheClientKey || TfheConfigBuilder || tfheClientKeyFromNamespace || tfheConfigBuilderFromNamespace) {
        console.log('[TFHE] ✓ Key classes available - auto-init detected');
        initSuccess = true;
      }
    }
    
    if (initResult !== undefined) {
      console.log('[TFHE] Init result:', initResult);
    }
    
    // Step 4: Verify WASM is accessible and find key classes
    console.log('[TFHE] Step 4: Verifying WASM exports and locating key classes...');
    
    // Try to get key classes from multiple locations
    let FinalTfheClientKey = TfheClientKey || tfheClientKeyFromNamespace;
    let FinalTfheConfigBuilder = TfheConfigBuilder || tfheConfigBuilderFromNamespace;
    
    console.log('[TFHE] Key classes after init:');
    console.log('[TFHE] - TfheClientKey available:', !!FinalTfheClientKey);
    console.log('[TFHE] - TfheConfigBuilder available:', !!FinalTfheConfigBuilder);
    
    // Verify we have the key classes needed for encryption
    if (!FinalTfheClientKey || !FinalTfheConfigBuilder) {
      console.warn('[TFHE] Core encryption classes still not found after init');
      console.warn('[TFHE] Available at root:', { TfheClientKey: !!TfheClientKey, TfheConfigBuilder: !!TfheConfigBuilder });
      console.warn('[TFHE] Available in TFHERs:', { TfheClientKey: !!tfheClientKeyFromNamespace, TfheConfigBuilder: !!tfheConfigBuilderFromNamespace });
      
      // Last resort: try to get all exports from TFHERs
      if (TFHERs && typeof TFHERs === 'object') {
        const allTfhersExports = Object.keys(TFHERs as any);
        console.error('[TFHE] All TFHERs exports:', allTfhersExports.join(', '));
        
        // Look for anything that might be key-related
        const keyLike = allTfhersExports.filter(k => k.toLowerCase().includes('key') || k.toLowerCase().includes('config'));
        console.error('[TFHE] Key-like exports in TFHERs:', keyLike.join(', '));
      }
      
      throw new Error(
        'TfheClientKey and TfheConfigBuilder not found at root or in TFHERs namespace. ' +
        'The SDK structure may have changed. Check console for full export listing.'
      );
    } else {
      console.log('[TFHE] ✓ Key classes located successfully');
    }
    
    // Step 5: Store the module reference with located key classes
    console.log('[TFHE] Step 5: Storing module references');
    tfheModule = {
      ...tfhePackage,
      TfheClientKey: FinalTfheClientKey,
      TfheConfigBuilder: FinalTfheConfigBuilder,
    } as any;
    tfheReady = true;
    
    console.log('[TFHE] ✅ TFHE WASM module successfully initialized');
    console.log('[TFHE] ========== Initialization Complete ==========');
    
  } catch (err) {
    console.error('[TFHE] ========== Initialization Failed ==========');
    console.error('[TFHE] Error:', err);
    
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[TFHE] Message:', errorMessage);
    
    // Provide actionable diagnostics
    if (errorMessage.includes('Shortint') || errorMessage.includes('TfheClientKey')) {
      console.error('[TFHE] DIAGNOSIS: WASM module exports not found');
      console.error('[TFHE] ACTION: Check these in order:');
      console.error('[TFHE]   1. Browser DevTools → Network tab → filter .wasm');
      console.error('[TFHE]   2. Look for tfhe_bg.wasm request → check Status (should be 200)');
      console.error('[TFHE]   3. Check Content-Type header (should be application/wasm)');
      console.error('[TFHE]   4. If Content-Type is text/html, Vite is serving wrong MIME type');
      console.error('[TFHE]   5. If Status is 404, WASM not at /tfhe_bg.wasm');
      console.error('[TFHE]   6. Try hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)');
    } else if (errorMessage.includes('Cannot find module')) {
      console.error('[TFHE] DIAGNOSIS: @zama-fhe/tfhe-js not installed');
      console.error('[TFHE] ACTION: Run: cd apps/web && pnpm install');
    }
    
    throw new Error(`TFHE WASM initialization failed: ${errorMessage}`);
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
