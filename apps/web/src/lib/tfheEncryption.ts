/**
 * src/lib/tfheEncryption_new.ts
 * 
 * TFHE Signal Encryption using @zama-fhe/tfhe-js@0.1.2
 * 
 * HIGH-LEVEL API - Uses the Key class from the package
 * 
 * Key insights:
 * - @zama-fhe/tfhe-js@0.1.2 provides: createKey(), Key class
 * - Key.encrypt(bigint): Uint8Array
 * - Key.decrypt(Uint8Array): bigint
 * - NO TfheClientKey or TfheConfigBuilder in this version (don't exist!)
 * - Use createKey() to generate new keys
 * 
 * From: https://docs.zama.org/guides/js-tfhe
 */

import type { NormalizedInputs } from './zama';

interface EncryptedSignals {
  followers: Uint8Array;
  txCount: Uint8Array;
  bracket: Uint8Array;
}

// Global state
let tfheModule: any = null;
let tfheReady = false;
let clientKey: any = null;

/**
 * Initialize TFHE WASM module
 * 
 * Loads @zama-fhe/tfhe-js and verifies initSDK is available
 */
export async function initializeTfheWasm(): Promise<void> {
  if (tfheReady) {
    console.log('[TFHE] WASM already initialized');
    return;
  }

  try {
    console.log('[TFHE] ========== Initializing TFHE WASM ==========');
    
    // Step 1: Import the package
    console.log('[TFHE] Step 1: Importing @zama-fhe/tfhe-js...');
    const tfhe = await import('@zama-fhe/tfhe-js') as any;
    
    console.log('[TFHE] ✓ Package imported');
    const exports = Object.keys(tfhe).filter(k => !k.startsWith('_'));
    console.log('[TFHE] Available exports:', exports.join(', '));
    
    // Step 2: Verify key functions exist
    console.log('[TFHE] Step 2: Checking for required functions...');
    const hasInitSDK = typeof tfhe.initSDK === 'function';
    const hasCreateKey = typeof tfhe.createKey === 'function';
    const hasKey = typeof tfhe.Key === 'function';
    
    console.log('[TFHE] - initSDK:', hasInitSDK ? '✓' : '✗');
    console.log('[TFHE] - createKey:', hasCreateKey ? '✓' : '✗');
    console.log('[TFHE] - Key class:', hasKey ? '✓' : '✗');
    
    if (!hasCreateKey) {
      throw new Error('createKey function not found in @zama-fhe/tfhe-js');
    }
    
    // Step 3: Initialize WASM via initSDK
    console.log('[TFHE] Step 3: Initializing WASM module...');
    if (hasInitSDK) {
      try {
        console.log('[TFHE] Calling initSDK()...');
        await tfhe.initSDK();
        console.log('[TFHE] ✓ initSDK() completed');
      } catch (err) {
        console.warn('[TFHE] initSDK() call failed:', err);
        console.log('[TFHE] Continuing anyway - createKey may still work...');
      }
    }
    
    // Step 4: Verify TFHERs namespace is now populated
    console.log('[TFHE] Step 4: Checking TFHERs namespace after init...');
    if (tfhe.TFHERs) {
      const tfhersKeys = Object.keys(tfhe.TFHERs).filter(k => !k.startsWith('_'));
      console.log('[TFHE] ✓ TFHERs available with', tfhersKeys.length, 'exports');
      console.log('[TFHE]   Sample exports:', tfhersKeys.slice(0, 5).join(', '));
    }
    
    // Step 5: Store module reference
    console.log('[TFHE] Step 5: Storing module reference');
    tfheModule = tfhe;
    tfheReady = true;
    
    console.log('[TFHE] ✅ TFHE initialization complete');
    console.log('[TFHE] Ready to generate keys and encrypt');
    
  } catch (err) {
    console.error('[TFHE] Initialization failed:', err);
    throw new Error(`TFHE initialization failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Check if TFHE is ready
 */
export function isTfheReady(): boolean {
  return tfheReady && tfheModule !== null;
}

/**
 * Generate a new TFHE key using the high-level API
 * 
 * Returns a Key object that can encrypt/decrypt
 */
export async function generateClientKeys(): Promise<any> {
  if (!isTfheReady()) {
    throw new Error('TFHE not initialized. Call initializeTfheWasm() first');
  }

  try {
    console.log('[TFHE] Generating new client key...');
    
    // Use the high-level createKey() function
    const key = tfheModule.createKey();
    
    console.log('[TFHE] ✓ Key generated');
    console.log('[TFHE] Key type:', typeof key);
    console.log('[TFHE] Key has encrypt:', typeof key.encrypt);
    console.log('[TFHE] Key has decrypt:', typeof key.decrypt);
    console.log('[TFHE] Key has exportKey:', typeof key.exportKey);
    
    return key;
  } catch (err) {
    console.error('[TFHE] Key generation failed:', err);
    throw new Error(`Failed to generate TFHE key: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Store client key in localStorage (as base64)
 */
export function storeClientKeyLocally(key: any): void {
  try {
    if (!key || typeof key.exportKey !== 'function') {
      console.warn('[TFHE] Key does not have exportKey method, skipping storage');
      return;
    }

    const base64Key = key.exportKey('base64');
    if (base64Key) {
      localStorage.setItem('tfhe_client_key', base64Key);
      console.log('[TFHE] ✓ Key stored in localStorage');
    } else {
      console.warn('[TFHE] exportKey() returned undefined');
    }
  } catch (err) {
    console.warn('[TFHE] Failed to store key:', err);
  }
}

/**
 * Retrieve client key from localStorage
 */
export function retrieveClientKeyLocally(): any {
  try {
    const base64Key = localStorage.getItem('tfhe_client_key');
    if (!base64Key) {
      console.log('[TFHE] No stored key found');
      return null;
    }

    if (!tfheModule || !tfheModule.createKeyFromBase64) {
      console.warn('[TFHE] Module not ready or createKeyFromBase64 not available');
      return null;
    }

    const key = tfheModule.createKeyFromBase64({ secretKey: base64Key });
    console.log('[TFHE] ✓ Key restored from localStorage');
    return key;
  } catch (err) {
    console.warn('[TFHE] Failed to retrieve key:', err);
    return null;
  }
}

/**
 * Encrypt signals using TFHE
 * 
 * Takes normalized inputs and encrypts each value separately
 * Returns object with encrypted fields
 */
export async function encryptSignalsWithTfhe(
  normalized: NormalizedInputs,
  key?: any
): Promise<EncryptedSignals> {
  if (!isTfheReady()) {
    throw new Error('TFHE not initialized');
  }

  try {
    // Use provided key or generate new one
    let encryptionKey = key;
    if (!encryptionKey) {
      encryptionKey = await generateClientKeys();
    }

    if (!encryptionKey || typeof encryptionKey.encrypt !== 'function') {
      throw new Error('Invalid key object - must have encrypt() method');
    }

    console.log('[TFHE] Encrypting signals:', {
      followers: normalized.followers,
      txCount: normalized.txCount,
      bracket: normalized.bracket,
    });

    // Encrypt each value as bigint
    // Note: Key.encrypt() expects bigint and returns Uint8Array
    const followers = encryptionKey.encrypt(BigInt(normalized.followers));
    const txCount = encryptionKey.encrypt(BigInt(normalized.txCount));
    const bracket = encryptionKey.encrypt(BigInt(normalized.bracket));

    console.log('[TFHE] ✓ Signals encrypted');
    console.log('[TFHE] Ciphertext sizes:', {
      followers: followers.length,
      txCount: txCount.length,
      bracket: bracket.length,
    });

    return { followers, txCount, bracket };
  } catch (err) {
    console.error('[TFHE] Encryption failed:', err);
    throw new Error(`TFHE encryption failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Decrypt signals using TFHE
 */
export async function decryptSignalsWithTfhe(
  encrypted: EncryptedSignals,
  key: any
): Promise<NormalizedInputs> {
  if (!isTfheReady()) {
    throw new Error('TFHE not initialized');
  }

  try {
    if (!key || typeof key.decrypt !== 'function') {
      throw new Error('Invalid key object - must have decrypt() method');
    }

    console.log('[TFHE] Decrypting signals...');

    // Decrypt each ciphertext
    const followers = Number(key.decrypt(encrypted.followers));
    const txCount = Number(key.decrypt(encrypted.txCount));
    const bracket = Number(key.decrypt(encrypted.bracket));

    console.log('[TFHE] ✓ Signals decrypted');
    console.log('[TFHE] Decrypted values:', { followers, txCount, bracket });

    return { followers, txCount, bracket };
  } catch (err) {
    console.error('[TFHE] Decryption failed:', err);
    throw new Error(`TFHE decryption failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Combined encryption: signals + commitment
 * 
 * This is what gets called from zama.ts
 */
export async function encryptWithTfheAndCommit(normalized: NormalizedInputs): Promise<{
  encrypted: EncryptedSignals;
  ciphertext: Uint8Array;
  commitment: string;
}> {
  try {
    // Ensure initialized
    if (!isTfheReady()) {
      console.log('[TFHE] Module not ready, initializing...');
      await initializeTfheWasm();
    }

    // Generate or retrieve key
    let key = clientKey;
    if (!key) {
      console.log('[TFHE] No key in memory, generating new one...');
      key = await generateClientKeys();
      storeClientKeyLocally(key);
      clientKey = key;
    }

    // Encrypt signals
    const encrypted = await encryptSignalsWithTfhe(normalized, key);

    // Create combined ciphertext (concat all encrypted values)
    const parts = [encrypted.followers, encrypted.txCount, encrypted.bracket];
    const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
    const ciphertext = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of parts) {
      ciphertext.set(part, offset);
      offset += part.length;
    }

    // Create commitment hash
    const encoder = new TextEncoder();
    const payload = JSON.stringify(normalized);
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(payload));
    const commitment = `0x${Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;

    console.log('[TFHE] ✓ Full encryption complete', {
      ciphertextSize: ciphertext.length,
      commitment,
    });

    return { encrypted, ciphertext, commitment };
  } catch (err) {
    console.error('[TFHE] Full encryption failed:', err);
    throw err;
  }
}
