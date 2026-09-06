# Two-to-three-minute demo

Use the local role selector during development. For judging, use separately connected Sepolia accounts and never describe local transactions as testnet transactions.

## What is live right now (2026-09-06)

Sepolia **Job 0 "Pact Website Delivery"** is a complete three-role ETH lifecycle: funded 0.014 ETH, milestone 1 delivered with a UI-pinned IPFS file and released (0.001), milestone 2 delivered with a CI link and released (0.008), milestone 3 disputed by the client and refunded by the arbitrator (0.005). All eight transactions, the dispute reason, the arbitration decision, and the contributor reputation (`2 released / 0 completed / score 2`) are on-chain — receipts in [FINAL-VERIFICATION.md](FINAL-VERIFICATION.md).

Still test-proven only: the live mUSDC approve/fund/release receipts and the `+5` reputation completion bonus. Run the 2-minute mUSDC add-on below before claiming them live.

## Before recording

- [x] Deploy and verify the new PactEscrow and MockUSDC — both verified on Blockscout Sepolia (links in [FINAL-VERIFICATION.md](FINAL-VERIFICATION.md)); Etherscan mirror pending a user API key.
- [x] Configure Vercel with both public addresses and a server-only Pinata JWT — confirmed in production 2026-09-06.
- [x] Client wallet holds 1,000,000 mUSDC from the constructor mint; all three role wallets hold Sepolia ETH for fees.
- [x] Public upload round-trip proven — `ipfs://QmRHNW45XjbVUhQamNRF1UozHNS3mg4myToZgqnZyRsu9F` opens through the public Pinata gateway; two further UI uploads are pinned in Job 0's deliveries.

## Script (live evidence)

1. **Core promise (20 seconds):** "Pact locks the full job upfront and settles each milestone independently." Open Agreement #001 — total funded 0.014 ETH, three milestones, three roles.
2. **Real IPFS evidence (30 seconds):** open milestone 1's `ipfs://` reference; it resolves through the public gateway. The CID is stored in the `MilestoneDelivered` event on Sepolia.
3. **Milestone-independent settlement (30 seconds):** milestones 1–2 show Released (0.001 + 0.008 ETH to the contributor); milestone 3 shows the client's dispute reason and the arbitrator's refund decision with its own transaction — 0.005 ETH returned. Released and refunded totals sit side by side in the stat cards.
4. **Objective reputation (20 seconds):** the contributor card shows "2 points — 2 released milestones · 0 completed jobs" and the formula. Point out that the refunded job deliberately does not count as completed.
5. **Close (20 seconds):** show the verified sources on Blockscout, green CI, and the test matrix covering ERC-20 exactness and adversarial payouts. State: "mUSDC funding and the completed-job bonus are covered by the passing suite; their one-command live run is scripted below."

## Optional 2-minute mUSDC add-on (when time allows)

Create a 2-milestone mUSDC agreement (125 + 75), deliver and approve both. This produces the live approve/`transferFrom` receipts and raises the contributor to `4 released / 1 completed / score 9` (+2 releases, +1 completed job ⇒ +7). Then show the updated reputation card.

Fallback: if Pinata or a public RPC is unavailable, identify the local Kubo/Hardhat setup explicitly. Do not imply public availability or Sepolia success when it is not working.
