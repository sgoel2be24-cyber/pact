# Pact

**Work agreed. Payment protected.**

[Open the public Sepolia app](https://pact-ten-gamma.vercel.app) · [Exact live-demo evidence and inputs](docs/LIVE-EVIDENCE.md)

[![Judge-ready checks](https://github.com/sgoel2be24-cyber/pact/actions/workflows/ci.yml/badge.svg)](https://github.com/sgoel2be24-cyber/pact/actions/workflows/ci.yml)

Pact is a HackBlox 2026 Web3 PS01 prototype: a client funds a freelance job upfront, a contributor submits work by milestone, and a client approval or named arbitrator's decision releases or refunds exactly that milestone's allocation.

## Read this first

- [Product scope and acceptance criteria](docs/SPEC.md)
- [Architecture and payment flow](docs/ARCHITECTURE.md)
- [Demo walkthrough](docs/DEMO.md)
- [Submission readiness](docs/READINESS.md)
- [Judging rubric and evidence priorities](docs/JUDGING.md)

## Run locally

Node 24 and npm are used by this project. All accounts below are disposable local test accounts. Never fund them on a public network.

```sh
npm ci
npm run compile
npm run chain
```

Leave that terminal running. In a second terminal:

```sh
npm run deploy:local
npm run demo:seed
npm run dev -- --port 3100
```

Open http://127.0.0.1:3100. The local role selector switches between client, contributor, and arbitrator. These actions send real transactions to the local Hardhat chain; the UI does not simulate balances or statuses. The seeded agreement has 0.025 ETH split across three milestones (0.012, 0.008, 0.005).

The chain is ephemeral. If it restarts, rerun deployment and seeding, then restart Next.js so the public configuration is rebuilt. A new local deployment overwrites `.env.local` intentionally. Local seeds refuse to overwrite an existing job history. Test execution uses a separate isolated chain on port 18545 and does not mutate the demo chain.

## Validate

```sh
npm test
npm run typecheck
npm run build
npm audit
```

The contract tests check access control, precise funding, invalid states, direct payouts, both arbitration outcomes, accounting isolation, repeated settlement, reverting recipients, and reentry. The production app build performs TypeScript validation.

## Sepolia deployment

### Recommended: deploy through MetaMask

Open `http://127.0.0.1:3100/deploy` in Chrome with MetaMask. Click **Connect & estimate fee**, review the Sepolia account and testnet fee, then **Deploy on Sepolia**. Confirm the transaction in MetaMask. No private key is exported. The page saves the public transaction hash locally so a refresh can recover it using **Check confirmation**.

After confirmation, download the public deployment record or copy its transaction hash. Validate it and configure Pact:

```sh
npm run configure:sepolia -- <deployment transaction hash>
npm run configure:sepolia -- <deployment transaction hash> --apply
```

The first command is read-only. It checks Sepolia, successful contract creation, deployment input, and deployed runtime bytecode against this compiled build. The second backs up the previous local configuration and writes the validated Sepolia configuration. Restart or rebuild the app afterward.

The current deployment is source-verified as an exact bytecode match on [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x00a549b25930B10f4DC9e102b5bb407812c66A18#code). A live three-role MetaMask escrow journey is still required.

### Alternative: command-line deployment

Use a dedicated testnet account funded with Sepolia ETH. Do not paste private keys in chat, commit them, or put them in any `NEXT_PUBLIC_*` variable. Configure `SEPOLIA_RPC_URL` and `DEPLOYER_PRIVATE_KEY` securely in your local shell, then:

```sh
npm run compile
npm run deploy:sepolia
```

The deployment script only permits chain 11155111 for a public deployment. It records the contract address, block, and transaction in `deployments/sepolia.json`. Deploy only `PactEscrow`; `TestReceivers` are adversarial test fixtures.

Replace `.env.local` with these public fields using that deployment record:

```dotenv
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
NEXT_PUBLIC_CONTRACT_ADDRESS=<deployed address>
NEXT_PUBLIC_DEPLOY_BLOCK=<deployment block>
```

Restart or rebuild the app. Sepolia uses the browser's MetaMask signer. Local unlocked-account switching is restricted to chain 31337 on a loopback hostname and loopback RPC URL. There is no backend signer.

Verify the contract on Sepolia Etherscan using **Solidity Standard JSON Input** from `artifacts/standard-input.json`. Select compiler **v0.8.28+commit.7893614a**, optimizer enabled with **200 runs**, EVM version **cancun**, contract **PactEscrow.sol:PactEscrow**, MIT license, and no constructor arguments. Record the verified explorer URL in the readiness document. A successful local test is not evidence of Sepolia deployment or explorer verification.

For Vercel, use the same four public environment variables and deploy the `pact` directory. Do not publish a build configured for the local chain. The frontend needs no database, server signing key, or privileged API credentials.

## Code map

```text
contracts/PactEscrow.sol       Funds, participants, states, and transitions
contracts/TestReceivers.sol    Adversarial fixtures used only by tests
lib/escrow.ts                  Typed reads, wallet access, activity, error messages
lib/abi.json                   Compiler-generated ABI; committed for app builds
components/workspace.tsx       Chain state, transactions, workspace composition
components/milestone-card.tsx  One milestone and its permitted actions
components/create-form.tsx     Agreement funding form and validation
components/primitives.tsx      Shared panels, references, modal, people
components/guide.tsx           Plain-language workflow and trust boundaries
app/globals.css                Responsive visual design
scripts/compile.mjs            Pinned compiler, ABI, verification input
scripts/deploy.mjs             Explicit local/Sepolia deployment
scripts/seed.mjs               Local-only demo agreement
scripts/test.mjs               Isolated local test-chain lifecycle
```

## Trust boundaries and limitations

- **Test funds only.** This is a hackathon prototype, not an audited production payment service.
- Client, contributor, and arbitrator must be distinct, nonzero addresses. Choosing the correct people and agreeing on scope is an off-chain responsibility; the contract does not establish their identity or collect their consent.
- The client decides whether work meets the scope. The named arbitrator has the final decision for disputes. There is no automatic evaluation or claim of trustless arbitration.
- No inactivity timeout, cancellation, partial arbitration award, appeal, or wallet recovery is implemented. An unresponsive client or arbitrator may leave funds locked. These require explicit product rules and tests before production use.
- Direct ETH transfer recipients must accept ETH. A failed transfer reverts the full settlement and preserves the escrow state. There is no alternate withdrawal destination.
- All scope, evidence references, dispute reasons, and decisions are public. Use non-sensitive data. HTTPS and IPFS references open external content; no claim is made that external files remain available or that the content is safe. The app supports existing IPFS references; hosted upload/pinning is not included yet.
- The workspace shows the most recent 50 agreements on this contract, with at most 60 activity events for the selected agreement. It is a shared contract workspace, not an authenticated private account.
- Activity is read in block ranges from the configured deployment block; long-lived deployments will need indexing or paginated history.
- Confirmation means one mined block. Reorg handling and multi-confirmation finality are outside this prototype.

## License

MIT. See [LICENSE](LICENSE).
