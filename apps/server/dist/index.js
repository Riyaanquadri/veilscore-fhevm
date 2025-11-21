import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { JsonRpcProvider, formatEther, isAddress } from "ethers";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(__dirname, "../../../.env");
dotenv.config({ path: rootEnvPath });
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const twitterBearer = process.env.TWITTER_BEARER_TOKEN;
const networkConfigs = {
    ethereum: { label: "Ethereum", rpcUrl: process.env.ETHEREUM_RPC_URL },
    base: { label: "Base", rpcUrl: process.env.BASE_RPC_URL },
    arbitrum: { label: "Arbitrum One", rpcUrl: process.env.ARBITRUM_RPC_URL },
    optimism: { label: "Optimism", rpcUrl: process.env.OPTIMISM_RPC_URL },
};
const explorerConfigs = {
    ethereum: { baseUrl: "https://api.etherscan.io/api", apiKey: process.env.ETHERSCAN_API_KEY },
    base: {
        baseUrl: "https://api.basescan.org/api",
        apiKey: process.env.BASESCAN_API_KEY || process.env.ETHERSCAN_API_KEY,
    },
    arbitrum: {
        baseUrl: "https://api.arbiscan.io/api",
        apiKey: process.env.ARBISCAN_API_KEY || process.env.ETHERSCAN_API_KEY,
    },
    optimism: {
        baseUrl: "https://api-optimistic.etherscan.io/api",
        apiKey: process.env.OPTIMISM_API_KEY || process.env.ETHERSCAN_API_KEY,
    },
};
const app = express();
app.use(cors());
app.use(express.json());
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.get("/api/signals", async (req, res) => {
    const { twitterHandle, address } = req.query;
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
            totalInboundEth: txData?.totalInboundEth,
            earliestFirstTx: txData?.earliestFirstTx,
            sources: txData?.sources,
        });
    }
    catch (err) {
        console.error("Failed to fetch signals", err);
        return res.status(500).json({ error: err.message || "Failed to fetch signals" });
    }
});
async function fetchTwitterFollowers(handle) {
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
async function fetchTxStats(address) {
    if (!isAddress(address)) {
        throw new Error("Invalid wallet address");
    }
    const perNetwork = await Promise.all(Object.entries(networkConfigs).map(async ([key, cfg]) => {
        const [txCount, explorerStats] = await Promise.all([
            fetchTxCount(cfg.rpcUrl, address, cfg.label),
            fetchExplorerStats(key, address),
        ]);
        console.log(`[signals] ${cfg.label} stats for ${address}: tx=${txCount}, firstTx=${explorerStats.firstTxAt}, inbound=${explorerStats.inboundEth}`);
        return {
            key,
            label: cfg.label,
            txCount,
            firstTxAt: explorerStats.firstTxAt,
            inboundEth: explorerStats.inboundEth,
        };
    }));
    const totalTxCount = perNetwork.reduce((sum, item) => sum + (item.txCount || 0), 0);
    const totalInboundEth = perNetwork.reduce((sum, item) => sum + (item.inboundEth || 0), 0);
    const earliestFirstTx = perNetwork.reduce((earliest, item) => {
        if (!item.firstTxAt) {
            return earliest;
        }
        if (!earliest || new Date(item.firstTxAt) < new Date(earliest)) {
            return item.firstTxAt;
        }
        return earliest;
    }, null);
    return {
        totalTxCount,
        totalInboundEth: Number(totalInboundEth.toFixed(6)),
        earliestFirstTx,
        sources: perNetwork,
    };
}
async function fetchTxCount(rpcUrl, address, label) {
    if (!rpcUrl) {
        return 0;
    }
    try {
        const provider = new JsonRpcProvider(rpcUrl);
        const raw = await provider.getTransactionCount(address);
        return Number.isFinite(Number(raw)) ? Number(raw) : 0;
    }
    catch (err) {
        console.error(`[signals] Failed to fetch ${label} tx count`, err);
        return 0;
    }
}
async function fetchExplorerStats(networkKey, address) {
    const explorer = explorerConfigs[networkKey];
    if (!explorer?.apiKey) {
        return { firstTxAt: null, inboundEth: 0 };
    }
    try {
        const url = new URL(explorer.baseUrl);
        url.searchParams.set("module", "account");
        url.searchParams.set("action", "txlist");
        url.searchParams.set("address", address);
        url.searchParams.set("startblock", "0");
        url.searchParams.set("endblock", "99999999");
        url.searchParams.set("sort", "asc");
        url.searchParams.set("page", "1");
        url.searchParams.set("offset", "10000");
        url.searchParams.set("apikey", explorer.apiKey);
        const resp = await axios.get(url.toString());
        const list = Array.isArray(resp.data?.result) ? resp.data.result : [];
        if (!list.length) {
            return { firstTxAt: null, inboundEth: 0 };
        }
        const checksum = address.toLowerCase();
        let inboundWei = 0n;
        for (const tx of list) {
            if (tx?.to && String(tx.to).toLowerCase() === checksum) {
                inboundWei += BigInt(tx.value || "0");
            }
        }
        const inboundEth = Number(formatEther(inboundWei));
        const firstTx = list[0];
        const firstTxAt = firstTx?.timeStamp ? new Date(Number(firstTx.timeStamp) * 1000).toISOString() : null;
        return {
            firstTxAt,
            inboundEth: Number(inboundEth.toFixed(6)),
        };
    }
    catch (err) {
        console.error(`[signals] Failed to fetch explorer stats for ${networkKey}`, err);
        return { firstTxAt: null, inboundEth: 0 };
    }
}
app.listen(port, () => {
    console.log(`VeilScore signal service running on http://localhost:${port}`);
});
