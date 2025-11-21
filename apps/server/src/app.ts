import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { JsonRpcProvider, isAddress } from "ethers";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(__dirname, "../../../.env");

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

type NetworkConfig = {
  label: string;
  rpcUrl?: string;
};

const twitterBearer = process.env.TWITTER_BEARER_TOKEN;

const networkConfigs: Record<string, NetworkConfig> = {
  ethereum: { label: "Ethereum", rpcUrl: process.env.ETHEREUM_RPC_URL },
  base: { label: "Base", rpcUrl: process.env.BASE_RPC_URL },
  arbitrum: { label: "Arbitrum One", rpcUrl: process.env.ARBITRUM_RPC_URL },
  optimism: { label: "Optimism", rpcUrl: process.env.OPTIMISM_RPC_URL },
};

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.get("/api/signals", async (req: Request, res: Response) => {
  const { twitterHandle, address } = req.query as { twitterHandle?: string; address?: string };

  if (!twitterHandle && !address) {
    return res.status(400).json({ error: "twitterHandle or address is required" });
  }

  try {
    const [followers, txData] = await Promise.all([
      twitterHandle ? fetchTwitterFollowers(twitterHandle) : undefined,
      address ? fetchTxStats(address) : undefined,
    ]);

    return res.json({
      followers,
      txCount: txData?.totalTxCount,
      sources: txData?.sources,
    });
  } catch (err: any) {
    console.error("Failed to fetch signals", err);
    return res.status(500).json({ error: err.message || "Failed to fetch signals" });
  }
});

async function fetchTwitterFollowers(handle: string) {
  if (!twitterBearer) {
    throw new Error("TWITTER_BEARER_TOKEN is not configured");
  }

  const url = `https://api.twitter.com/2/users/by/username/${handle}?user.fields=public_metrics`;
  const resp = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${twitterBearer}`,
    },
  });
  return resp.data?.data?.public_metrics?.followers_count ?? null;
}

async function fetchTxStats(address: string) {
  if (!isAddress(address)) {
    throw new Error("Invalid wallet address");
  }

  const perNetwork = await Promise.all(
    Object.entries(networkConfigs).map(async ([key, cfg]) => {
      const txCount = await fetchTxCount(cfg.rpcUrl, address, cfg.label);

      console.log(`[signals] ${cfg.label} stats for ${address}: tx=${txCount}`);

      return {
        key,
        label: cfg.label,
        txCount,
      };
    })
  );

  const totalTxCount = perNetwork.reduce((sum, item) => sum + (item.txCount || 0), 0);

  return {
    totalTxCount,
    sources: perNetwork,
  };
}

async function fetchTxCount(rpcUrl: string | undefined, address: string, label: string) {
  if (!rpcUrl) {
    return 0;
  }
  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const raw = await provider.getTransactionCount(address);
    return Number.isFinite(Number(raw)) ? Number(raw) : 0;
  } catch (err) {
    console.error(`[signals] Failed to fetch ${label} tx count`, err);
    return 0;
  }
}

export default app;
