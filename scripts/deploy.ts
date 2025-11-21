import { ethers } from "hardhat";

async function main() {
  const VeilScore = await ethers.getContractFactory("VeilScore");
  const veilScore = await VeilScore.deploy();
  await veilScore.waitForDeployment();

  console.log("VeilScore deployed to:", await veilScore.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
