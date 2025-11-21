const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export type NetworkSource = {
  key: string;
  label: string;
  txCount: number;
  firstTxAt: string | null;
  inboundEth: number;
};

export type SignalResponse = {
  followers?: number | null;
  txCount?: number | null;
  totalInboundEth?: number | null;
  earliestFirstTx?: string | null;
  sources?: NetworkSource[];
};

export async function fetchSignals(params: { twitterHandle?: string; address?: string }) {
  const query = new URLSearchParams();
  if (params.twitterHandle) query.set("twitterHandle", params.twitterHandle);
  if (params.address) query.set("address", params.address);
  const resp = await fetch(`${API_BASE}/api/signals?${query.toString()}`);
  if (!resp.ok) {
    const payload = await resp.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to fetch signals");
  }
  return (await resp.json()) as SignalResponse;
}
