import { spawn } from "node:child_process";
const run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)),
    );
  });
await run(process.execPath, ["scripts/compile.mjs"]);
const port = 18545;
const chain = spawn(
  process.execPath,
  [
    "node_modules/hardhat/dist/src/cli.js",
    "node",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  { stdio: "ignore" },
);
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (chain.exitCode !== null)
      throw new Error("Isolated test chain exited before startup.");
    try {
      const result = await fetch(`http://127.0.0.1:${port}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_chainId",
          params: [],
        }),
      });
      if ((await result.json()).result === "0x7a69") {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error("Test chain did not become ready.");
  await run(
    process.execPath,
    ["--test", "--test-concurrency=1", "tests/escrow.test.mjs"],
    { env: { ...process.env, TEST_RPC_URL: `http://127.0.0.1:${port}` } },
  );
} finally {
  chain.kill("SIGTERM");
}
