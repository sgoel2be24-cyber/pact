// One-command Etherscan source verification for the Sepolia deployment.
// Usage: node scripts/verify-etherscan.mjs <ETHERSCAN_API_KEY>
// Submits artifacts/standard-input.json for PactEscrow and MockUSDC with the
// exact build settings and polls until each result is known. The API key is
// read only from argv and is never written to disk.
import fs from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const apiKey = process.argv[2]?.trim();
if (!apiKey) {
  console.error("Usage: node scripts/verify-etherscan.mjs <ETHERSCAN_API_KEY>");
  process.exit(1);
}

const deployment = JSON.parse(
  fs.readFileSync("deployments/sepolia.json", "utf8"),
);
const standardInput = fs.readFileSync("artifacts/standard-input.json", "utf8");

const contracts = [
  { name: "PactEscrow.sol:PactEscrow", address: deployment.address },
  { name: "MockUSDC.sol:MockUSDC", address: deployment.mockUsdcAddress },
];

const API = "https://api-sepolia.etherscan.io/api";

async function submit(contract) {
  const body = new URLSearchParams({
    apikey: apiKey,
    module: "contract",
    action: "verifysourcecode",
    codeformat: "solidity-standard-json-input",
    contractaddress: contract.address,
    contractname: contract.name,
    compilerversion: "v0.8.28+commit.7893614a",
    optimizationUsed: "1",
    runs: "200",
    evmversion: "cancun",
    licenseType: "3", // MIT
    constructorArguments: "",
    sourceCode: standardInput,
  });
  const response = await fetch(API, { method: "POST", body });
  const result = await response.json();
  if (result.status !== "1") {
    if (/already verified/i.test(result.result || "")) return { already: true };
    throw new Error(
      `Submission rejected for ${contract.name}: ${result.result}`,
    );
  }
  return { guid: result.result };
}

async function poll(contract, guid) {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    await delay(5000);
    const query = new URLSearchParams({
      apikey: apiKey,
      module: "contract",
      action: "checkverifystatus",
      guid,
    });
    const result = await (await fetch(`${API}?${query}`)).json();
    const status = String(result.result);
    if (!/pending|processing/i.test(status)) return status;
  }
  return "Timed out waiting for Etherscan; check the contract page manually.";
}

for (const contract of contracts) {
  console.log(`Submitting ${contract.name} at ${contract.address}…`);
  const { guid, already } = await submit(contract);
  if (already) {
    console.log(
      `Already verified: https://sepolia.etherscan.io/address/${contract.address}#code`,
    );
    continue;
  }
  const outcome = await poll(contract, guid);
  console.log(`${contract.name}: ${outcome}`);
  console.log(
    `Contract page: https://sepolia.etherscan.io/address/${contract.address}#code`,
  );
}
