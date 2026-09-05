import fs from "node:fs";
import { JsonRpcProvider, Wallet, ContractFactory } from "ethers";
const local = process.argv.includes("--local");
if (!local && !process.argv.includes("--sepolia"))
  throw new Error("Choose --local or --sepolia explicitly.");
const rpc = local ? "http://127.0.0.1:8545" : process.env.SEPOLIA_RPC_URL;
if (!rpc) throw new Error("Set SEPOLIA_RPC_URL in your shell.");
const provider = new JsonRpcProvider(rpc);
const network = await provider.getNetwork();
if (network.chainId !== (local ? 31337n : 11155111n))
  throw new Error(
    "Wrong chain: deployment allowed only on local Hardhat or Sepolia.",
  );
if (!local && !process.env.DEPLOYER_PRIVATE_KEY)
  throw new Error(
    "Set DEPLOYER_PRIVATE_KEY securely in your shell. Never paste it into chat.",
  );
const signer = local
  ? await provider.getSigner(0)
  : new Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
const escrowArtifact = JSON.parse(
  fs.readFileSync("artifacts/PactEscrow.json", "utf8"),
);
const tokenArtifact = JSON.parse(
  fs.readFileSync("artifacts/MockUSDC.json", "utf8"),
);
const token = await new ContractFactory(
  tokenArtifact.abi,
  tokenArtifact.bytecode,
  signer,
).deploy();
const tokenReceipt = await token.deploymentTransaction().wait();
const contract = await new ContractFactory(
  escrowArtifact.abi,
  escrowArtifact.bytecode,
  signer,
).deploy();
const receipt = await contract.deploymentTransaction().wait();
const address = await contract.getAddress();
const mockUsdcAddress = await token.getAddress();
fs.mkdirSync(local ? ".local" : "deployments", { recursive: true });
const record = {
  chainId: Number(network.chainId),
  address,
  block: receipt.blockNumber,
  transaction: receipt.hash,
  mockUsdcAddress,
  mockUsdcTransaction: tokenReceipt.hash,
  compiler: "0.8.28",
  optimizerRuns: 200,
};
fs.writeFileSync(
  local ? ".local/deployment.json" : "deployments/sepolia.json",
  JSON.stringify(record, null, 2),
);
if (local)
  fs.writeFileSync(
    ".env.local",
    `NEXT_PUBLIC_CHAIN_ID=31337\nNEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545\nNEXT_PUBLIC_CONTRACT_ADDRESS=${address}\nNEXT_PUBLIC_DEPLOY_BLOCK=${receipt.blockNumber}\nNEXT_PUBLIC_MOCK_USDC_ADDRESS=${mockUsdcAddress}\nIPFS_RPC_URL=http://127.0.0.1:5001\n`,
  );
console.log(JSON.stringify(record, null, 2));
provider.destroy();
