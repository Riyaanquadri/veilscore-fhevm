import React, { useState } from "react";
import { normalizeInputs, encryptWithTFHE, callFHECompute } from "../lib/zama";
import { submitToContract } from "../lib/contract";
import { fetchSignals, NetworkSource } from "../lib/signals";

export default function InputForm() {
  const [followers, setFollowers] = useState<number>(1000);
  const [txCount, setTxCount] = useState<number>(10);
  const [chainSources, setChainSources] = useState<NetworkSource[]>([]);
  const [twitterHandle, setTwitterHandle] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCompute = async () => {
    setLoading(true);
    setError(null);
    setStatus("Encrypting and evaluating under FHE (simulated)…");
    try {
      const normalized = await normalizeInputs({ followers, txCount, bracket: 1 });
      const { ciphertext, commitment } = await encryptWithTFHE(normalized);
      const result = await callFHECompute(ciphertext);
      await submitToContract(commitment, result.allowed);
      setAllowed(result.allowed);
      setStatus("Commitment + boolean stored on-chain.");
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
      const data = await fetchSignals({ twitterHandle, address: walletAddress });
      if (typeof data.followers === "number") {
        setFollowers(data.followers);
      }
      if (typeof data.txCount === "number") {
        setTxCount(data.txCount);
      }
      setChainSources(Array.isArray(data.sources) ? data.sources : []);
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
            {followers > 0 && <div className="badge">{followers.toLocaleString()} followers</div>}
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
            {txCount > 0 && <div className="badge">{txCount} transactions</div>}
          </div>
        </div>

        <button onClick={onPrefill} className="primary-btn" disabled={prefillLoading}>
          {prefillLoading ? "Fetching imprints…" : "OnChain Imprints"}
        </button>

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
      </section>
    </div>
  );
}
