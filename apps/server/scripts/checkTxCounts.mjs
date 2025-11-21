import { JsonRpcProvider } from "ethers";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../../.env");
dotenv.config({ path: envPath });
console.log("Loaded env from", envPath);

const urls = {
  ethereum: process.env.ETHEREUM_RPC_URL,
  base: process.env.BASE_RPC_URL,
  arbitrum: process.env.ARBITRUM_RPC_URL,
  optimism: process.env.OPTIMISM_RPC_URL,
};

const address = process.argv[2] || "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

async function run() {
  for (const [label, url] of Object.entries(urls)) {
    if (!url) {
      console.log(`${label}: missing URL`);
      continue;
    }
    try {
      const provider = new JsonRpcProvider(url);
      const count = Number(await provider.getTransactionCount(address));
      console.log(`${label}: ${count}`);
    } catch (err) {
      console.error(`${label}: failed ->`, err.message);
    }
  }
}

run();
