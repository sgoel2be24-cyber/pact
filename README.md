# Pact

**Work agreed. Payment protected.**

[Public app](https://pact-ten-gamma.vercel.app) · [Demo script](docs/DEMO.md) · [Readiness](docs/READINESS.md) · [Security review](docs/SECURITY.md)

[![Judge-ready checks](https://github.com/sgoel2be24-cyber/pact/actions/workflows/ci.yml/badge.svg)](https://github.com/sgoel2be24-cyber/pact/actions/workflows/ci.yml)

Pact is a HackBlox 2026 Web3 PS01 prototype. A client locks native ETH or mock USDC against two or three milestones. The contributor submits evidence; client approval or the named arbitrator's decision settles only that milestone.

The stretch build adds three judge-visible features without removing the original ETH path:

- upload and pin agreement specs or deliverables to IPFS, then store the returned `ipfs://CID` on-chain; direct HTTPS and existing IPFS references still work;
- on-chain reputation based only on released milestones and fully released jobs: `score = released milestones + 5 × completed jobs`;
- 6-decimal `mUSDC` escrow using the standard `approve → transferFrom → transfer` flow. The faucet-style mock token is valueless and testnet-only.

> The stretch contracts are deployed and source-verified on Sepolia, the public IPFS upload round-trip works, and a full three-role ETH lifecycle (fund → IPFS evidence → releases → dispute → arbitrator refund) is live on-chain — see [docs/FINAL-VERIFICATION.md](docs/FINAL-VERIFICATION.md). The mUSDC receipts and the reputation completion bonus are test-proven and still need one short live run before being presented as live evidence.

## Run locally

Use Node 24. All local accounts and assets are disposable.

```sh
npm ci
npm run compile
npm run chain
```

In a second terminal:

```sh
npm run deploy:local
npm run demo:seed
npm run dev -- --port 3100
```

Open http://127.0.0.1:3100. The seed creates one funded ETH agreement and one completed mUSDC agreement whose contributor has 2 released milestones, 1 completed job, and a score of 7.

### Free IPFS upload

The app never sends pinning credentials to the browser. Choose one server-side backend:

1. **No account or API key:** run a local [Kubo](https://docs.ipfs.tech/install/command-line/) node with its default loopback RPC endpoint (`ipfs init`, then `ipfs daemon`). `.env.local` created by `deploy:local` points to `http://127.0.0.1:5001`.
2. **Vercel:** create a free Pinata account and set the server-only `PINATA_JWT` environment variable. The route uses Pinata's documented [`pinFileToIPFS`](https://docs.pinata.cloud/api-reference/endpoint/ipfs/pin-file-to-ipfs) endpoint.

Uploads are capped at 4 MB, checked for same-origin browser requests, rate-limited best-effort to five requests per minute per forwarded IP, pinned, validated as a CID, and returned as `ipfs://...`. Kubo's RPC endpoint must remain private; never expose port 5001 publicly. If no backend is configured, the UI clearly falls back to pasted HTTPS or IPFS references.

## Verify

```sh
npm run format:check
npm run compile
npm test
npm run typecheck
npm run build
npm audit
```

The automated suite covers the original ETH lifecycle and adversarial recipients, exact ERC-20 allowance/deposits/releases/refunds, rejection of fee-on-transfer funding, reputation counters and score rules, and the IPFS route's successful pin, size limit, and origin check.

## Deploy to Sepolia and Vercel

Use a dedicated testnet account. Keep `DEPLOYER_PRIVATE_KEY`, `SEPOLIA_RPC_URL`, and `PINATA_JWT` only in secure shell/Vercel secret storage; never commit them or prefix them with `NEXT_PUBLIC_`.

```sh
npm run compile
npm run deploy:sepolia
```

The script deploys `MockUSDC` and then `PactEscrow`, refuses non-Sepolia public deployment, and writes both addresses and transactions to `deployments/sepolia.json`. Validate and apply the escrow deployment while also checking the token bytecode:

```sh
npm run configure:sepolia -- <escrow-deployment-tx> --mock-usdc <mock-token-address>
npm run configure:sepolia -- <escrow-deployment-tx> --mock-usdc <mock-token-address> --apply
```

Set these Vercel variables and redeploy:

```dotenv
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
NEXT_PUBLIC_CONTRACT_ADDRESS=<new PactEscrow address>
NEXT_PUBLIC_DEPLOY_BLOCK=<escrow deployment block>
NEXT_PUBLIC_MOCK_USDC_ADDRESS=<new MockUSDC address>
PINATA_JWT=<server-only free-tier token>
```

The `/deploy` page is a no-private-key helper that deploys MockUSDC and PactEscrow in two MetaMask confirmations. The command-line deployment remains available for automation. Verify both contracts on Etherscan with compiler `v0.8.28+commit.7893614a`, optimizer 200 runs, EVM `cancun`, and `artifacts/standard-input.json`; neither constructor has arguments.

## Code map

```text
contracts/PactEscrow.sol       ETH/ERC-20 escrow, milestone state, reputation
contracts/MockUSDC.sol         Valueless 6-decimal faucet token for demos
app/api/ipfs/route.ts          Server-only Kubo/Pinata upload-and-pin boundary
components/ipfs-upload.tsx     Reusable file upload control
lib/escrow.ts                  Chain reads, token metadata, wallet helpers
scripts/deploy.mjs             Paired local/Sepolia deployment
scripts/seed.mjs               ETH + completed mUSDC demonstration state
tests/escrow.test.mjs          Contract lifecycle and adversarial tests
tests/ipfs.test.mjs            Upload endpoint behavior tests
```

## Trust boundaries and limitations

- Test funds only. This is independently reviewed hackathon code, not a professional audit.
- Arbitration remains human and trusted. No timeout, cancellation, appeal, recovery, or automatic quality judgment is implemented.
- A reputation score proves on-chain releases, not identity or work quality. Colluding wallets can inflate it with small jobs.
- The UI offers only configured ETH and mUSDC. The contract can accept other conventional ERC-20s, but rejects fee-on-transfer deposits; unusual or malicious tokens can still block their own jobs and should not be trusted.
- IPFS content is public. A CID proves content addressing, not legality, safety, or permanent availability. Availability lasts only while at least one node keeps the content pinned.
- The public upload route is intentionally unauthenticated for a judge demo. Its size/origin/rate controls reduce abuse but do not replace provider quotas or authentication for production.
- A failed ETH or ERC-20 payout reverts all milestone state and accounting. Other milestone allocations remain untouched.

## License

MIT. See [LICENSE](LICENSE).
