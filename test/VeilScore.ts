import { expect } from "chai";
import { ethers } from "hardhat";

describe("VeilScore", function () {
  it("submits and reads entry", async function () {
    const [owner] = await ethers.getSigners();
    const VeilScore = await ethers.getContractFactory("VeilScore");
    const veilScore = await VeilScore.deploy();
    await veilScore.deployed();

    const commitment = ethers.utils.formatBytes32String("commit-1");
    await veilScore.connect(owner).submit(commitment, true);

    const [storedCommitment, allowed, timestamp] = await veilScore.getEntry(owner.address);
    expect(storedCommitment).to.equal(commitment);
    expect(allowed).to.equal(true);
    expect(timestamp).to.be.gt(0);
  });
});
