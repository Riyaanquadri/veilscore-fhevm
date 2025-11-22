import React, { useState, useEffect } from "react";
import { normalizeInputs, encryptWithTFHE, callFHECompute } from "../lib/zama";
import { submitToContract } from "../lib/contract";
import { fetchSignals, NetworkSource } from "../lib/signals";
import { useUserHistory } from "../hooks/useUserHistory";

const TIER_LABELS = ["Diamond", "Gold", "Silver", "Bronze", "Unranked"];

export default function InputForm() {
  const { history, lastEntry, addEntry, clearHistory, removeEntry } = useUserHistory();
  
  const [followers, setFollowers] = useState<number>(0);
  const [txCount, setTxCount] = useState<number>(0);
  const [normalizedFollowers, setNormalizedFollowers] = useState<number>(0);
  const [normalizedTxCount, setNormalizedTxCount] = useState<number>(0);
  const [chainSources, setChainSources] = useState<NetworkSource[]>([]);
  const [twitterHandle, setTwitterHandle] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bracket, setBracket] = useState<number>(4);
  const [showHistory, setShowHistory] = useState(false);

  // Auto-populate from last entry on mount
  useEffect(() => {
    if (lastEntry) {
      console.log('[InputForm] Auto-populating from last entry:', {
        twitterHandle: lastEntry.twitterHandle,
        walletAddress: lastEntry.walletAddress,
      });
      setTwitterHandle(lastEntry.twitterHandle);
      setWalletAddress(lastEntry.walletAddress);
      
      // Also restore previous results if available
      if (lastEntry.followers) setFollowers(lastEntry.followers);
      if (lastEntry.txCount) setTxCount(lastEntry.txCount);
    }
  }, [lastEntry]);

  const fetchAndHydrateSignals = async () => {
    if (!twitterHandle && !walletAddress) {
      throw new Error("Provide a Twitter handle or wallet address.");
    }

    const data = await fetchSignals({ twitterHandle, address: walletAddress });
    let latestFollowers = followers;
    let latestTxCount = txCount;

    if (typeof data.followers === "number") {
      latestFollowers = data.followers;
      setFollowers(latestFollowers);
    }
    if (typeof data.txCount === "number") {
      latestTxCount = data.txCount;
      setTxCount(latestTxCount);
    }

    setChainSources(Array.isArray(data.sources) ? data.sources : []);

    const normalized = await normalizeInputs({ followers: latestFollowers, txCount: latestTxCount });
    setNormalizedFollowers(normalized.followers);
    setNormalizedTxCount(normalized.txCount);
    setBracket(normalized.bracket);

    return {
      latestFollowers,
      latestTxCount,
      normalizedFollowers: normalized.followers,
      normalizedTxCount: normalized.txCount,
      bracket: normalized.bracket,
    };
  };

  const onCompute = async () => {
    setLoading(true);
    setError(null);
    let effectiveFollowers = normalizedFollowers;
    let effectiveTxCount = normalizedTxCount;
    let effectiveBracket = bracket;
    try {
      if (effectiveFollowers === 0 && effectiveTxCount === 0) {
        if (twitterHandle || walletAddress) {
          setStatus("Fetching live signals for current inputs…");
          const hydrated = await fetchAndHydrateSignals();
          effectiveFollowers = hydrated.normalizedFollowers;
          effectiveTxCount = hydrated.normalizedTxCount;
          effectiveBracket = hydrated.bracket;
        } else {
          throw new Error("Run OnChain Imprints to fetch normalized signals first.");
        }
      }

      if (effectiveFollowers === 0 && effectiveTxCount === 0) {
        throw new Error("Unable to compute because normalized signals are zero.");
      }

      setStatus("Encrypting and evaluating under FHE (simulated)…");
      const normalizedPayload = { followers: effectiveFollowers, txCount: effectiveTxCount, bracket: effectiveBracket };
      const { ciphertext, commitment } = await encryptWithTFHE(normalizedPayload);
      const result = await callFHECompute(ciphertext);
      await submitToContract(commitment, result.allowed);
      setAllowed(result.allowed);
      setStatus("Commitment + boolean stored on-chain.");
      
      // Save to history after successful computation
      addEntry({
        twitterHandle,
        walletAddress,
        followers: effectiveFollowers,
        txCount: effectiveTxCount,
        tier: TIER_LABELS[effectiveBracket] || 'Unranked',
      });
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const onPrefill = async () => {
    if (!twitterHandle && !walletAddress) {
      setError("Provide a Twitter handle or wallet address to prefill signals.");
      return;
    }
    setError(null);
    setPrefillLoading(true);
    setStatus("Fetching live signals…");
    try {
      await fetchAndHydrateSignals();
      setStatus("Signals fetched. You can tweak before computing.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch signals");
    } finally {
      setPrefillLoading(false);
    }
  };

  return (
    <div className="veil-grid">
      <section className="glass-card hero-card">
        <span className="hero-pill">Private Reputation</span>
        <h1 className="hero-title">Compute a VeilScore without revealing signals.</h1>
        <p className="hero-body">
          Signals stay encrypted end-to-end. We simulate the Zama FHE pipeline here: normalize inputs → encrypt →
          evaluate → share only a commitment and threshold flag with the on-chain contract.
        </p>
        <div className="hero-metrics">
          <div className="metric-chip">
            <div className="metric-label">Client-side</div>
            <div className="metric-value">Encryption</div>
          </div>
          <div className="metric-chip">
            <div className="metric-label">Runtime</div>
            <div className="metric-value">FHEVM</div>
          </div>
          <div className="metric-chip">
            <div className="metric-label">Result</div>
            <div className="metric-value">1 bit</div>
          </div>
        </div>
      </section>

      <section className="glass-card form-card">
        <div className="input-grid">
          <div className="input-group-with-badge">
            <div>
              <label>Twitter Handle</label>
              <input
                type="text"
                placeholder="riyaanquadri"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
              />
            </div>
            {followers > 0 && (
              <div className="badge">Followers: {followers.toLocaleString()}</div>
            )}
          </div>
          <div className="input-group-with-badge">
            <div>
              <label>Wallet Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
              />
            </div>
            {txCount > 0 && <div className="badge">Transactions: {txCount.toLocaleString()}</div>}
          </div>
        </div>

        <button onClick={onPrefill} className="primary-btn" disabled={prefillLoading}>
          {prefillLoading ? "Fetching imprints…" : "OnChain Imprints"}
        </button>

        {(normalizedFollowers > 0 || normalizedTxCount > 0) && (
          <div className="tier-banner">
            <div className="tier-banner__title">Current Tier</div>
            <div className="tier-banner__value">{TIER_LABELS[bracket] ?? "Unranked"}</div>
          </div>
        )}

        <div className="chain-breakdown">
          <h3>Per-chain signals</h3>
          {chainSources.length === 0 ? (
            <p className="status-text">Fetch signals to view chain-level transaction counts.</p>
          ) : (
            <div className="chain-grid">
              {chainSources.map((source) => (
                <div key={source.key} className="metric-chip chain-chip">
                  <div className="metric-label">{source.label}</div>
                  <div className="metric-value">{source.txCount} transactions</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={onCompute} disabled={loading} className="primary-btn">
          {loading ? "Computing VeilScore…" : "Compute VeilScore"}
        </button>

        {status && <div className="status-text">{status}</div>}

        {allowed !== null && (
          <div className={`result-chip ${allowed ? "success" : "danger"}`}>
            {allowed ? "Access Granted" : "Access Denied"}
          </div>
        )}

        {error && <div className="error-box">{error}</div>}

        {/* History Section */}
        {history.length > 0 && (
          <div className="history-section">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="history-toggle"
              type="button"
            >
              {showHistory ? "▼" : "▶"} History ({history.length})
            </button>

            {showHistory && (
              <div className="history-container">
                {history.map((entry, index) => (
                  <div key={`${entry.timestamp}-${index}`} className="history-item">
                    <div className="history-item-content">
                      <div className="history-handle">
                        {entry.twitterHandle && (
                          <span className="history-badge twitter">@{entry.twitterHandle}</span>
                        )}
                        {entry.walletAddress && (
                          <span className="history-badge wallet">
                            {entry.walletAddress.substring(0, 6)}...{entry.walletAddress.substring(-4)}
                          </span>
                        )}
                      </div>
                      {entry.tier && (
                        <div className="history-tier">Tier: <strong>{entry.tier}</strong></div>
                      )}
                      {entry.followers && (
                        <div className="history-stats">
                          Followers: {entry.followers.toLocaleString()} | TX: {entry.txCount?.toLocaleString()}
                        </div>
                      )}
                      <div className="history-time">
                        {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="history-actions">
                      <button
                        onClick={() => {
                          setTwitterHandle(entry.twitterHandle);
                          setWalletAddress(entry.walletAddress);
                          setShowHistory(false);
                        }}
                        className="history-btn-load"
                        title="Load this entry"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => removeEntry(index)}
                        className="history-btn-delete"
                        title="Delete this entry"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    if (confirm("Clear all history?")) {
                      clearHistory();
                    }
                  }}
                  className="history-clear-btn"
                >
                  Clear All History
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
