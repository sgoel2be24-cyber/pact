import fs from "node:fs";
import { Contract, JsonRpcProvider, parseEther, parseUnits } from "ethers";
const provider = new JsonRpcProvider("http://127.0.0.1:8545");
if ((await provider.getNetwork()).chainId !== 31337n)
  throw new Error("Demo seeds are local-only.");
const { address, mockUsdcAddress } = JSON.parse(
  fs.readFileSync(".local/deployment.json", "utf8"),
);
const { abi } = JSON.parse(
  fs.readFileSync("artifacts/PactEscrow.json", "utf8"),
);
const [client, freelancer, arbitrator] = await Promise.all(
  [0, 1, 2].map((i) => provider.getSigner(i)),
);
const contract = new Contract(address, abi, client);
const tokenArtifact = JSON.parse(
  fs.readFileSync("artifacts/MockUSDC.json", "utf8"),
);
const token = new Contract(mockUsdcAddress, tokenArtifact.abi, client);
if ((await contract.jobCount()) !== 0n)
  throw new Error("This deployment already has jobs; preserving its state.");
await (
  await contract.createJob(
    await freelancer.getAddress(),
    await arbitrator.getAddress(),
    "Open-source SDK integration",
    "Implement a typed SDK integration with validation, tests, and a reproducible demo. Agree on acceptance criteria before funding.",
    ["API implementation", "Tests & error handling", "Docs & live walkthrough"],
    [parseEther("0.012"), parseEther("0.008"), parseEther("0.005")],
    { value: parseEther("0.025") },
  )
).wait();
const tokenAmounts = [parseUnits("125", 6), parseUnits("75", 6)];
const tokenTotal = tokenAmounts.reduce((sum, amount) => sum + amount, 0n);
await (await token.approve(address, tokenTotal)).wait();
await (
  await contract.createTokenJob(
    await freelancer.getAddress(),
    await arbitrator.getAddress(),
    mockUsdcAddress,
    "IPFS brand kit delivery",
    "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3g3b6zj5qnqvyamztqfup2m4u",
    ["Design source", "Handoff package"],
    tokenAmounts,
  )
).wait();
for (let milestoneId = 0; milestoneId < 2; milestoneId++) {
  await (
    await contract
      .connect(freelancer)
      .deliver(
        1,
        milestoneId,
        `ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3g3b6zj5qnqvyamztqfup2m4u/deliverable-${milestoneId + 1}`,
      )
  ).wait();
  await (await contract.approve(1, milestoneId)).wait();
}
console.log(
  "Seeded one funded ETH agreement and one completed mUSDC agreement with on-chain reputation. Client = local account 0; contributor = 1; arbitrator = 2.",
);
provider.destroy();
