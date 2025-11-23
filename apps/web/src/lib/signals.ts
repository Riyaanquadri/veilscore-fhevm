const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export type NetworkSource = {
  key: string;
  label: string;
  txCount: number;
};

export type SignalResponse = {
  followers?: number | null;
  txCount?: number | null;
  sources?: NetworkSource[];
};

export async function fetchSignals(params: { twitterHandle?: string; address?: string }) {
  const query = new URLSearchParams();
  if (params.twitterHandle) query.set("twitterHandle", params.twitterHandle);
  if (params.address) query.set("address", params.address);
  
  const url = `${API_BASE}/api/signals?${query.toString()}`;
  console.log('[signals] Fetching from:', url);
  
  try {
    const resp = await fetch(url);
    console.log('[signals] Response status:', resp.status);
    
    if (!resp.ok) {
      const payload = await resp.json().catch(() => ({}));
      throw new Error(payload.error || `HTTP ${resp.status}: Failed to fetch signals`);
    }
    
    const data = (await resp.json()) as SignalResponse;
    console.log('[signals] Fetched data:', data);
    return data;
  } catch (err) {
    console.error('[signals] Fetch error:', err);
    throw new Error(err instanceof Error ? err.message : "Failed to fetch signals");
  }
}
