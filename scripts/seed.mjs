import fs from "node:fs";
import { Contract, JsonRpcProvider, parseEther } from "ethers";
const provider = new JsonRpcProvider("http://127.0.0.1:8545");
if ((await provider.getNetwork()).chainId !== 31337n)
  throw new Error("Demo seeds are local-only.");
const { address } = JSON.parse(
  fs.readFileSync(".local/deployment.json", "utf8"),
);
const { abi } = JSON.parse(
  fs.readFileSync("artifacts/PactEscrow.json", "utf8"),
);
const [client, freelancer, arbitrator] = await Promise.all(
  [0, 1, 2].map((i) => provider.getSigner(i)),
);
const contract = new Contract(address, abi, client);
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
console.log(
  "Seeded one funded agreement. Client = local account 0; contributor = 1; arbitrator = 2.",
);
provider.destroy();
