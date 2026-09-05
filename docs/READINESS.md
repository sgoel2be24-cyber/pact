# Submission readiness

Status: Sepolia contract deployed and source-verified; public frontend deployed at https://pact-ten-gamma.vercel.app. Public desktop/mobile layout checks pass; MetaMask connection is stopped at its phishing warning. Complete live-wallet verification, recording, and submission remain.

Priority: [judging evidence](JUDGING.md). Secure the live demo (40%), contract evidence (25%), and wallet UX (20%) before optional bonus work (15%). These weights are not scores already earned.

Wallet setup: three distinct MetaMask accounts are ready for Client, Contributor, and Arbitrator. Contributor and Arbitrator each have 0.003 Sepolia ETH for demo transaction fees.

- [x] Core contract implements exact funding, independent milestones, delivery, approval, dispute, release/refund.
- [x] Contract tests pass (12 scenarios).
- [x] Role-aware frontend and transaction feedback implemented.
- [x] Production build and TypeScript checks pass.
- [x] Dependency audit clean after overriding solc's vulnerable temporary-file dependency.
- [x] GitHub Actions workflow runs formatting, types, contract tests, production build, and production dependency audit.
- [x] Browser journey verified for create → deliver → release and dispute → refund.
- [x] Mobile layout and failure feedback inspected (390px, no horizontal overflow).
- [x] Sepolia contract deployed with dedicated funded testnet wallet.
- [x] Contract source verified as an exact bytecode match on Sepolia Etherscan.
- [x] Frontend deployed with Sepolia configuration.
- [ ] MetaMask journey verified on Sepolia.
- [x] Public GitHub repository created/pushed with green judge-ready CI.
- [x] IPFS upload/pinning explicitly omitted while full live verification remains pending.
- [ ] Final two-minute recording captured.
- [ ] Final submission links entered by user.

Keep evidence of each completed gate. A local demo is not a substitute for required testnet evidence.

## Sepolia evidence — September 5

- Public frontend: https://pact-ten-gamma.vercel.app (Vercel production; all four requested Sepolia environment variables persisted).
- Exact role-by-role inputs and receipt checklist: [LIVE-EVIDENCE.md](LIVE-EVIDENCE.md).
- Verified contract: https://sepolia.etherscan.io/address/0x00a549b25930B10f4DC9e102b5bb407812c66A18#code
- Deployment transaction: https://sepolia.etherscan.io/tx/0xd6e39ecbfebedc9b6682798ecb8230f82bd1e56c7361319f9bcc999fe5296f92 (block 11639875).
- Live Agreement #001 / on-chain job 0 funded with 0.025 ETH: https://sepolia.etherscan.io/tx/0xfd83f7f3ec4448cf9631214069f05775a84842183d625f13c067b51aa37c6eb1 (block 11639956).
- RPC event verification matches the intended Client, Contributor, Arbitrator, and 0.012/0.008/0.005 ETH allocations.
- Public repository: https://github.com/sgoel2be24-cyber/pact
- Judge-ready CI: https://github.com/sgoel2be24-cyber/pact/actions/workflows/ci.yml

## Browser evidence — September 5

- The initial browser-policy outage cleared on retry. Public desktop (1440×1080) and mobile (390×844) layouts were inspected; mobile document width equals viewport width (390px), with no horizontal overflow. Agreement #001, all three funded milestones, 0.025 ETH protected, participant addresses, original funding receipt, and three proof links load correctly. No browser warning/error logs were recorded. A browser without MetaMask shows explicit install/reload feedback.
- Real Chrome MetaMask connection reached a wallet warning: “Continue at your own risk,” reporting signs of phishing or wallet-draining activity for the public URL. The agent did not select “Connect anyway.” User review is required before continuing; connection, account switching, and live transactions remain unverified. The warning’s cause has not been established. Responsive emulation is not a physical-phone MetaMask test.
- Current source passes all 12 contract tests, type-checking, formatting, production build, and full dependency audit (zero vulnerabilities). Contract source and generated ABI/deployment bytecode remain unchanged.
- Local browser transactions: first delivery block 3; approval block 4; second delivery block 5; dispute block 6; arbitrator refund block 7. Result: job 0 released 0.012 ETH, refunded 0.008 ETH, and retained 0.005 ETH.
- A second two-milestone agreement was created through the form at block 8 for 0.003 ETH. Overlapping roles were rejected before submission.
- Desktop 1440×1080 and mobile 390×844 inspected. Mobile dialog content fits its width; Escape closes it. Missing MetaMask produces an explicit connection message.
- Local screenshots are in `output/playwright/` (ignored from version control). No Sepolia or injected-wallet success is claimed.

## Wallet deployment and verification

- `/deploy` provides MetaMask fee estimation and Sepolia-only contract deployment, with public transaction-hash recovery after refresh.
- `configure:sepolia` verifies transaction success, deployment input, and deployed runtime code before optionally applying public app configuration.
- Production build and TypeScript pass. Deployment code matches the already tested local contract. Missing-wallet browser feedback checked.
- Public deployment and MetaMask agreement-funding transactions succeeded. The remaining wallet gate is the full Contributor delivery → Client approval/dispute → Arbitrator resolution journey.
