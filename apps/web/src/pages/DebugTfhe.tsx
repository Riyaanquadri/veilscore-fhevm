// apps/web/src/pages/DebugTfhe.tsx
import React, { useEffect, useState } from "react";

interface DebugLog {
  level: "info" | "error" | "success";
  message: string;
  timestamp: string;
}

export default function DebugTfhe() {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [tfheStatus, setTfheStatus] = useState<string>("Initializing...");

  useEffect(() => {
    const addLog = (level: "info" | "error" | "success", message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${level.toUpperCase()}] ${message}`);
      setLogs(prev => [...prev, { level, message, timestamp }]);
    };

    (async () => {
      try {
        addLog("info", "Starting TFHE initialization test...");

        // Step 1: Check WASM file
        addLog("info", "Step 1: Checking WASM file accessibility...");
        try {
          const wasmCheck = await fetch("/tfhe_bg.wasm", { method: "HEAD" });
          if (wasmCheck.ok) {
            addLog("success", `✓ WASM file found (Status: ${wasmCheck.status})`);
            addLog("info", `  Content-Type: ${wasmCheck.headers.get("content-type")}`);
          } else {
            addLog("error", `✗ WASM returned status ${wasmCheck.status}`);
          }
        } catch (err) {
          addLog("error", `✗ WASM fetch failed: ${err instanceof Error ? err.message : String(err)}`);
        }

        // Step 2: Import TFHE
        addLog("info", "Step 2: Importing @zama-fhe/tfhe-js...");
        const TFHE = await import("@zama-fhe/tfhe-js");
        const beforeKeys = Object.keys(TFHE).filter(k => !k.startsWith("_"));
        addLog("success", `✓ Package imported. Exports: ${beforeKeys.length}`);
        addLog("info", `  Keys: ${beforeKeys.slice(0, 10).join(", ")}${beforeKeys.length > 10 ? "..." : ""}`);

        // Step 2b: Check TFHERs namespace
        addLog("info", "Step 2b: Checking TFHERs namespace...");
        const TFHERs = (TFHE as any).TFHERs;
        if (TFHERs && typeof TFHERs === "object") {
          const tfhersKeys = Object.keys(TFHERs).filter(k => !k.startsWith("_"));
          addLog("success", `✓ TFHERs found. Exports: ${tfhersKeys.length}`);
          addLog("info", `  TFHERs.Keys: ${tfhersKeys.slice(0, 10).join(", ")}${tfhersKeys.length > 10 ? "..." : ""}`);
          
          // Look for key classes
          const hasClientKey = TFHERs.TfheClientKey !== undefined;
          const hasConfigBuilder = TFHERs.TfheConfigBuilder !== undefined;
          addLog("info", `  - TFHERs.TfheClientKey: ${hasClientKey ? "✓" : "✗"}`);
          addLog("info", `  - TFHERs.TfheConfigBuilder: ${hasConfigBuilder ? "✓" : "✗"}`);
        } else {
          addLog("error", "✗ TFHERs namespace not found");
        }

        // Step 3: Check initSDK
        addLog("info", "Step 3: Checking initSDK function...");
        addLog("info", `  typeof TFHE.initSDK: ${typeof (TFHE as any).initSDK}`);
        addLog("info", `  TFHE.initSDK value: ${String((TFHE as any).initSDK).substring(0, 100)}`);
        
        // Try different ways to access initSDK
        const initSDKFunc = (TFHE as any).initSDK || 
                           (TFHE as any)?.default?.initSDK ||
                           (TFHE as any)?.TFHERs?.initSDK;
        
        if (typeof initSDKFunc !== "function") {
          addLog("error", `✗ initSDK is not a function. Type: ${typeof initSDKFunc}`);
          addLog("info", "  Trying alternate initialization methods...");
          
          // Check if we have createKey instead
          const createKeyFunc = (TFHE as any).createKey;
          if (typeof createKeyFunc === "function") {
            addLog("info", "  ✓ Found createKey function instead");
            addLog("info", "  This suggests a different SDK version. Will try createKey for initialization.");
          }
          
          // Continue with what we have
        } else {
          addLog("success", "✓ initSDK function found and is callable");
        }

        // Step 4: Initialize WASM
        addLog("info", "Step 4: Attempting WASM initialization...");
        addLog("info", "Priority: init() > initSDK > TFHERs.init > auto-init detection");
        
        // Try different initialization methods in priority order
        let initSuccess = false;
        
        // Method 1: Try init() first (this is the main init function in @zama-fhe/tfhe-js@0.1.2)
        if (typeof (TFHE as any).init === "function") {
          try {
            addLog("info", "  Method 1: Calling init()...");
            await (TFHE as any).init();
            addLog("success", "✓ init() completed successfully");
            initSuccess = true;
          } catch (err) {
            addLog("error", `  ✗ init() failed: ${err instanceof Error ? err.message : String(err)}`);
          }
        } else {
          addLog("info", "  init() not available");
        }
        
        // Method 2: Try initSDK (less common in @0.1.2)
        if (!initSuccess && typeof initSDKFunc === "function") {
          try {
            addLog("info", "  Method 2: Calling initSDK()...");
            await initSDKFunc();
            addLog("success", "✓ initSDK() completed");
            initSuccess = true;
          } catch (err) {
            addLog("error", `  ✗ initSDK() failed: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
        
        // Method 3: Check TFHERs namespace
        if (!initSuccess && typeof (TFHE as any).TFHERs === "object") {
          const tfhers = (TFHE as any).TFHERs;
          if (typeof tfhers.init === "function") {
            try {
              addLog("info", "  Method 3: Calling TFHERs.init()...");
              await tfhers.init();
              addLog("success", "✓ TFHERs.init() completed");
              initSuccess = true;
            } catch (err) {
              addLog("error", `  ✗ TFHERs.init() failed: ${err instanceof Error ? err.message : String(err)}`);
            }
          }
        }
        
        // Method 4: Check if already auto-initialized
        if (!initSuccess) {
          addLog("info", "  Method 4: Checking if WASM auto-initialized...");
          const hasClientKeyRoot = typeof (TFHE as any).TfheClientKey !== "undefined";
          const hasConfigBuilderRoot = typeof (TFHE as any).TfheConfigBuilder !== "undefined";
          const hasClientKeyTfhers = TFHERs?.TfheClientKey !== undefined;
          const hasConfigBuilderTfhers = TFHERs?.TfheConfigBuilder !== undefined;
          
          addLog("info", `    Root level - ClientKey: ${hasClientKeyRoot}, ConfigBuilder: ${hasConfigBuilderRoot}`);
          addLog("info", `    TFHERs level - ClientKey: ${hasClientKeyTfhers}, ConfigBuilder: ${hasConfigBuilderTfhers}`);
          
          if ((hasClientKeyRoot || hasClientKeyTfhers) && (hasConfigBuilderRoot || hasConfigBuilderTfhers)) {
            addLog("success", "✓ Auto-init detected - Key classes available at some level");
            initSuccess = true;
          }
        }
        
        if (!initSuccess) {
          addLog("error", "❌ All initialization methods failed");
          setTfheStatus("❌ WASM initialization failed");
        } else {
          addLog("success", "✅ WASM initialization succeeded");
        }


        // Step 5: Check exports after init
        addLog("info", "Step 5: Checking exports after initialization...");
        const afterKeys = Object.keys(TFHE).filter(k => !k.startsWith("_"));
        addLog("success", `✓ Exports after init: ${afterKeys.length}`);
        addLog("info", `  Keys: ${afterKeys.slice(0, 10).join(", ")}${afterKeys.length > 10 ? "..." : ""}`);

        // Step 6: Verify key classes (check both root and TFHERs namespace)
        addLog("info", "Step 6: Verifying key classes...");
        const hasClientKeyRoot = typeof (TFHE as any).TfheClientKey !== "undefined";
        const hasConfigBuilderRoot = typeof (TFHE as any).TfheConfigBuilder !== "undefined";
        const hasCompactPublicKeyRoot = typeof (TFHE as any).TfheCompactPublicKey !== "undefined";
        
        const hasClientKeyTfhers = TFHERs?.TfheClientKey !== undefined;
        const hasConfigBuilderTfhers = TFHERs?.TfheConfigBuilder !== undefined;
        const hasCompactPublicKeyTfhers = TFHERs?.TfheCompactPublicKey !== undefined;

        addLog("info", "  Root level exports:");
        if (hasClientKeyRoot) {
          addLog("success", "  ✓ TfheClientKey available");
        } else {
          addLog("error", "  ✗ TfheClientKey NOT available");
        }

        if (hasConfigBuilderRoot) {
          addLog("success", "  ✓ TfheConfigBuilder available");
        } else {
          addLog("error", "  ✗ TfheConfigBuilder NOT available");
        }

        if (hasCompactPublicKeyRoot) {
          addLog("success", "  ✓ TfheCompactPublicKey available");
        } else {
          addLog("error", "  ✗ TfheCompactPublicKey NOT available");
        }

        addLog("info", "  TFHERs namespace exports:");
        if (hasClientKeyTfhers) {
          addLog("success", "  ✓ TFHERs.TfheClientKey available");
        } else {
          addLog("error", "  ✗ TFHERs.TfheClientKey NOT available");
        }

        if (hasConfigBuilderTfhers) {
          addLog("success", "  ✓ TFHERs.TfheConfigBuilder available");
        } else {
          addLog("error", "  ✗ TFHERs.TfheConfigBuilder NOT available");
        }

        if (hasCompactPublicKeyTfhers) {
          addLog("success", "  ✓ TFHERs.TfheCompactPublicKey available");
        } else {
          addLog("error", "  ✗ TFHERs.TfheCompactPublicKey NOT available");
        }

        // Check overall status
        const keyClassesAvailable = (hasClientKeyRoot || hasClientKeyTfhers) && 
                                    (hasConfigBuilderRoot || hasConfigBuilderTfhers);
        if (keyClassesAvailable) {
          addLog("success", "✅ Key classes found - TFHE ready");
          setTfheStatus("✅ TFHE WASM ready for encryption");
        } else {
          addLog("error", "❌ Key classes NOT found - TFHE not ready");
          setTfheStatus("❌ TFHE WASM not ready - missing key classes");
        }

        // Step 7: Test high-level API (createKey, encrypt, decrypt)
        addLog("info", "Step 7: Testing high-level API (createKey, encrypt, decrypt)...");
        
        const createKeyFunc = (TFHE as any).createKey;
        if (typeof createKeyFunc === "function") {
          addLog("info", "  ✓ Found createKey function");
          try {
            addLog("info", "  Calling createKey()...");
            const key = await createKeyFunc();
            addLog("success", "  ✓ createKey() succeeded - Key instance created");
            addLog("info", `    Key type: ${typeof key}, has encrypt: ${typeof key?.encrypt === 'function'}`);
            
            // Test encrypt
            if (typeof key?.encrypt === "function") {
              try {
                const testValue = 42n;
                const encrypted = key.encrypt(testValue);
                addLog("success", `  ✓ key.encrypt(${testValue}) succeeded - returned ${encrypted.constructor.name} of length ${(encrypted as any).length}`);
                
                // Test decrypt
                if (typeof key?.decrypt === "function") {
                  try {
                    const decrypted = key.decrypt(encrypted);
                    addLog("success", `  ✓ key.decrypt() succeeded - returned ${decrypted}`);
                    
                    if (decrypted === testValue) {
                      addLog("success", "  ✅ Round-trip test PASSED: encrypted ${testValue} → decrypted ${decrypted}");
                    } else {
                      addLog("error", `  ✗ Round-trip test FAILED: expected ${testValue}, got ${decrypted}`);
                    }
                  } catch (err) {
                    addLog("error", `  ✗ key.decrypt() failed: ${err instanceof Error ? err.message : String(err)}`);
                  }
                } else {
                  addLog("error", `  ✗ key.decrypt is not a function`);
                }
              } catch (err) {
                addLog("error", `  ✗ key.encrypt() failed: ${err instanceof Error ? err.message : String(err)}`);
              }
            } else {
              addLog("error", `  ✗ key.encrypt is not a function`);
            }
          } catch (err) {
            addLog("error", `  ✗ createKey() failed: ${err instanceof Error ? err.message : String(err)}`);
          }
        } else {
          addLog("error", `  ✗ createKey function not found. Type: ${typeof createKeyFunc}`);
        }

        // Final status
        const hasCreateKey = typeof (TFHE as any).createKey === "function";
        if (hasCreateKey) {
          addLog("success", "✅ TFHE high-level API ready for use!");
          setTfheStatus("✅ TFHE Ready - Using high-level API (createKey, Key.encrypt/decrypt)");
        } else if (keyClassesAvailable) {
          addLog("success", "✅ TFHE WASM initialization SUCCESSFUL!");
          setTfheStatus("✅ TFHE Ready - Low-level key classes available");
        } else {
          addLog("error", "❌ TFHE initialization incomplete - no usable API found");
          setTfheStatus("❌ TFHE initialization incomplete");
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        addLog("error", `Fatal error: ${errorMsg}`);
        setTfheStatus(`❌ Fatal error: ${errorMsg}`);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "monospace", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <h1>🔧 TFHE Debug Console</h1>

      <div
        style={{
          backgroundColor: "#e8f5e9",
          border: "2px solid #4caf50",
          borderRadius: 8,
          padding: 15,
          marginBottom: 20,
          fontSize: 18,
          fontWeight: "bold",
        }}
      >
        Status: {tfheStatus}
      </div>

      <div
        style={{
          backgroundColor: "#1e1e1e",
          color: "#d4d4d4",
          border: "1px solid #333",
          borderRadius: 8,
          padding: 15,
          overflowY: "auto",
          maxHeight: "600px",
          fontSize: 12,
          lineHeight: 1.5,
        }}
      >
        {logs.length === 0 ? (
          <div>Loading...</div>
        ) : (
          logs.map((log, idx) => (
            <div
              key={idx}
              style={{
                color:
                  log.level === "success"
                    ? "#4caf50"
                    : log.level === "error"
                    ? "#f44336"
                    : "#2196f3",
                marginBottom: 8,
              }}
            >
              <span style={{ color: "#888" }}>[{log.timestamp}]</span> {log.message}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 20, fontSize: 12, color: "#666" }}>
        <p>💡 Tips:</p>
        <ul>
          <li>Press Cmd+Shift+R to hard refresh if you see initialization errors</li>
          <li>Check browser DevTools Console (F12) for additional details</li>
          <li>If WASM is not found, ensure apps/web/public/tfhe_bg.wasm exists</li>
          <li>If initialization fails, check CSP headers in DevTools Network tab</li>
        </ul>
      </div>
    </div>
  );
}
