import fs from "node:fs";
import { JsonRpcProvider } from "ethers";

const hash = process.argv[2];
if (!/^0x[0-9a-fA-F]{64}$/.test(hash ?? ""))
  throw new Error(
    "Usage: npm run configure:sepolia -- <deployment transaction hash> [--apply]",
  );
const rpc =
  process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const provider = new JsonRpcProvider(rpc);
try {
  if ((await provider.getNetwork()).chainId !== 11155111n)
    throw new Error("Configuration is allowed only for Sepolia.");
  const receipt = await provider.getTransactionReceipt(hash);
  if (!receipt || receipt.status !== 1 || !receipt.contractAddress)
    throw new Error("A successful, confirmed contract deployment is required.");
  const tx = await provider.getTransaction(hash);
  const artifact = JSON.parse(
    fs.readFileSync("lib/deployment-code.json", "utf8"),
  );
  const deployed = await provider.getCode(receipt.contractAddress);
  if (
    !tx ||
    tx.data.toLowerCase() !== artifact.bytecode.toLowerCase() ||
    deployed.toLowerCase() !== artifact.deployedBytecode.toLowerCase()
  )
    throw new Error(
      "Deployment does not match the current compiled Pact contract.",
    );
  const record = {
    chainId: 11155111,
    address: receipt.contractAddress,
    block: receipt.blockNumber,
    transaction: receipt.hash,
    compiler: "0.8.28",
    optimizerRuns: 200,
  };
  console.log(JSON.stringify(record, null, 2));
  if (process.argv.includes("--apply")) {
    fs.mkdirSync("deployments", { recursive: true });
    fs.mkdirSync(".local", { recursive: true });
    if (fs.existsSync(".env.local"))
      fs.copyFileSync(
        ".env.local",
        `.local/env-before-sepolia-${Date.now()}.backup`,
      );
    fs.writeFileSync(
      "deployments/sepolia.json",
      JSON.stringify(record, null, 2) + "\n",
    );
    // Keep a private RPC credential out of public environment fields.
    const publicRpc = "https://ethereum-sepolia-rpc.publicnode.com";
    fs.writeFileSync(
      ".env.local",
      `NEXT_PUBLIC_CHAIN_ID=11155111\nNEXT_PUBLIC_RPC_URL=${publicRpc}\nNEXT_PUBLIC_CONTRACT_ADDRESS=${record.address}\nNEXT_PUBLIC_DEPLOY_BLOCK=${record.block}\n`,
    );
    console.log(
      "Sepolia configuration saved. Restart or rebuild the app. Explorer verification is still required.",
    );
  } else
    console.log("Verified read-only. Add --apply to configure the local app.");
} finally {
  provider.destroy();
}
