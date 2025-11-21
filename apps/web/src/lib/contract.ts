import { BrowserProvider, Contract, ethers } from "ethers";
import VeilScoreArtifact from "../../../../artifacts/contracts/VeilScore.sol/VeilScore.json";

const VEILSCORE_ADDRESS = import.meta.env.VITE_VEILSCORE_ADDRESS as string;

export async function getContract(): Promise<Contract> {
  if (!window.ethereum) {
    throw new Error("No injected wallet found (window.ethereum not available)");
  }
  const provider = new BrowserProvider(window.ethereum as any);
  const signer = await provider.getSigner();

  if (!VEILSCORE_ADDRESS) {
    throw new Error("VITE_VEILSCORE_ADDRESS is not set");
  }

  return new Contract(VEILSCORE_ADDRESS, VeilScoreArtifact.abi, signer);
}

export async function submitToContract(commitment: string, allowed: boolean) {
  const contract = await getContract();

  // commitment is a bytes32; ensure string is 66 chars (0x + 64 hex)
  if (!ethers.isHexString(commitment) || ethers.dataLength(commitment) !== 32) {
    throw new Error("commitment must be 32 bytes hex string");
  }

  const tx = await contract.submit(commitment, allowed);
  await tx.wait();
}
