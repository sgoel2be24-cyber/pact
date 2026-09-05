import fs from "node:fs";
import path from "node:path";
import solc from "solc";
import { format } from "prettier";

const sources = Object.fromEntries(
  ["PactEscrow.sol", "MockUSDC.sol", "TestReceivers.sol"].map((name) => [
    name,
    { content: fs.readFileSync(`contracts/${name}`, "utf8") },
  ]),
);
const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "cancun",
    outputSelection: {
      "*": {
        "*": [
          "abi",
          "evm.bytecode.object",
          "evm.deployedBytecode.object",
          "metadata",
        ],
      },
    },
  },
};
const output = JSON.parse(
  solc.compile(JSON.stringify(input), {
    import: (name) => {
      try {
        return {
          contents: fs.readFileSync(path.join("node_modules", name), "utf8"),
        };
      } catch {
        return { error: `Import not found: ${name}` };
      }
    },
  }),
);
for (const error of output.errors ?? []) console.error(error.formattedMessage);
if (output.errors?.some((error) => error.severity === "error")) process.exit(1);
fs.mkdirSync("artifacts", { recursive: true });
for (const [source, contracts] of Object.entries(output.contracts))
  for (const [name, contract] of Object.entries(contracts)) {
    fs.writeFileSync(
      `artifacts/${name}.json`,
      JSON.stringify(
        {
          contractName: name,
          sourceName: source,
          abi: contract.abi,
          bytecode: `0x${contract.evm.bytecode.object}`,
          deployedBytecode: `0x${contract.evm.deployedBytecode.object}`,
          metadata: contract.metadata,
        },
        null,
        2,
      ),
    );
  }
fs.writeFileSync(
  "lib/abi.json",
  await format(
    JSON.stringify(output.contracts["PactEscrow.sol"].PactEscrow.abi),
    { parser: "json" },
  ),
);
fs.writeFileSync(
  "lib/deployment-code.json",
  await format(
    JSON.stringify({
      bytecode: `0x${output.contracts["PactEscrow.sol"].PactEscrow.evm.bytecode.object}`,
      deployedBytecode: `0x${output.contracts["PactEscrow.sol"].PactEscrow.evm.deployedBytecode.object}`,
    }),
    { parser: "json" },
  ),
);
fs.writeFileSync(
  "lib/mock-usdc-deployment-code.json",
  await format(
    JSON.stringify({
      bytecode: `0x${output.contracts["MockUSDC.sol"].MockUSDC.evm.bytecode.object}`,
      deployedBytecode: `0x${output.contracts["MockUSDC.sol"].MockUSDC.evm.deployedBytecode.object}`,
    }),
    { parser: "json" },
  ),
);
// Self-contained standard JSON input for explorer verification.
for (const source of Object.keys(output.sources))
  if (!input.sources[source])
    input.sources[source] = {
      content: fs.readFileSync(path.join("node_modules", source), "utf8"),
    };
fs.writeFileSync(
  "artifacts/standard-input.json",
  JSON.stringify(input, null, 2),
);
console.log(
  `Compiled PactEscrow with solc ${solc.version()}; ABI exported to lib/abi.json.`,
);
