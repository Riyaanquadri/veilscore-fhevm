#!/usr/bin/env node
/**
 * Test TFHE API at runtime (Node.js environment)
 * This replicates what the debug console does
 */

async function testTFHE() {
  console.log('\n========== TFHE API Test ==========\n');
  
  try {
    // Step 1: Import
    console.log('Step 1: Importing @zama-fhe/tfhe-js...');
    const TFHE = await import('@zama-fhe/tfhe-js/dist/node/src/index.js');
    const keys = Object.keys(TFHE).filter(k => !k.startsWith('_'));
    console.log(`✓ Imported. Exports: ${keys.length}`);
    console.log(`  Keys: ${keys.join(', ')}\n`);
    
    // Step 2: Check for initialization functions
    console.log('Step 2: Checking initialization functions...');
    const hasInit = typeof TFHE.init === 'function';
    const hasInitSDK = typeof TFHE.initSDK === 'function';
    const hasCreateKey = typeof TFHE.createKey === 'function';
    console.log(`  - init: ${hasInit ? '✓' : '✗'}`);
    console.log(`  - initSDK: ${hasInitSDK ? '✓' : '✗'}`);
    console.log(`  - createKey: ${hasCreateKey ? '✓' : '✗'}\n`);
    
    // Step 3: Initialize if needed
    if (hasInit) {
      console.log('Step 3: Initializing WASM via init()...');
      await TFHE.init();
      console.log('✓ init() completed\n');
    } else if (hasInitSDK) {
      console.log('Step 3: Initializing WASM via initSDK()...');
      await TFHE.initSDK();
      console.log('✓ initSDK() completed\n');
    }
    
    // Step 4: Test high-level API
    console.log('Step 4: Testing high-level API (createKey)...');
    if (!hasCreateKey) {
      console.log('✗ createKey function not found\n');
      process.exit(1);
    }
    
    const key = await TFHE.createKey();
    console.log('✓ createKey() succeeded');
    console.log(`  Key type: ${key.constructor.name}`);
    console.log(`  Has encrypt: ${typeof key?.encrypt === 'function'}`);
    console.log(`  Has decrypt: ${typeof key?.decrypt === 'function'}\n`);
    
    // Step 5: Test encrypt/decrypt
    console.log('Step 5: Testing encrypt/decrypt round-trip...');
    const testValue = 42n;
    console.log(`  Test value: ${testValue}`);
    
    const encrypted = key.encrypt(testValue);
    console.log(`✓ encrypt(${testValue}) succeeded`);
    console.log(`  Encrypted: ${encrypted.constructor.name}[${encrypted.length}]`);
    
    const decrypted = key.decrypt(encrypted);
    console.log(`✓ decrypt() succeeded`);
    console.log(`  Decrypted: ${decrypted}`);
    
    if (decrypted === testValue) {
      console.log(`✅ Round-trip test PASSED: ${testValue} → encrypted → ${decrypted}\n`);
    } else {
      console.log(`❌ Round-trip test FAILED: expected ${testValue}, got ${decrypted}\n`);
      process.exit(1);
    }
    
    // Step 6: Test exportKey/createKeyFromBase64
    console.log('Step 6: Testing key persistence (export/import)...');
    if (typeof key?.exportKey === 'function' && typeof TFHE.createKeyFromBase64 === 'function') {
      const exported = key.exportKey('base64');
      console.log(`✓ exportKey('base64') returned: ${exported?.substring(0, 30)}...`);
      
      const imported = await TFHE.createKeyFromBase64({ secretKey: exported });
      console.log(`✓ createKeyFromBase64() succeeded`);
      
      const testValue2 = 123n;
      const encrypted2 = imported.encrypt(testValue2);
      const decrypted2 = imported.decrypt(encrypted2);
      
      if (decrypted2 === testValue2) {
        console.log(`✅ Key persistence test PASSED: imported key works correctly\n`);
      } else {
        console.log(`❌ Key persistence test FAILED: expected ${testValue2}, got ${decrypted2}\n`);
        process.exit(1);
      }
    }
    
    console.log('========== ✅ ALL TESTS PASSED ==========\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  }
}

testTFHE();
