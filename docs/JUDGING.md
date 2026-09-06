# Judging evidence — HackBlox Web3 PS01

Source: official rubric screenshot provided by Shikhar, September 5, 2026. Weights are judging criteria, not a guaranteed score.

| Criterion                         | Weight | Verified in this source build                                                                                                                                                                                             | Still required for public proof                                                                                                |
| --------------------------------- | -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Working demo on testnet           |    40% | Complete local ETH and mUSDC flows; bonus contracts deployed on Sepolia, bytecode identical to this source; **three-role ETH lifecycle live with receipts** (fund, IPFS delivery, 2 releases, dispute, arbitrator refund) | mUSDC token receipts (approve/fund/release) — one 2-minute run                                                                 |
| Contract correctness and security |    25% | Exact allocation, role/state checks, CEI, reentrancy guard, SafeERC20, fee-token rejection, 18 contract scenarios; wrong-role calls verified reverting on the live contract                                               | ~~Explorer verification~~ both contracts verified on Blockscout Sepolia (Etherscan mirror pending a user API key)              |
| UI / UX and wallet flow           |    20% | Asset-aware amounts, two-step token feedback, IPFS controls, reputation display                                                                                                                                           | ~~Responsive + wallet checks~~ desktop, mobile, and all three MetaMask roles exercised live on 2026-09-06; zero console errors |
| Creativity and bonus features     |    15% | All three bonus implementations complete; **IPFS bonus live** (public upload + CID stored in a Sepolia delivery + gateway retrieval); reputation counters live (`2 released / 0 completed / score 2`)                     | Live mUSDC receipts and the `+5` reputation completion bonus (test-proven; scripted add-on run)                                |

## Bonus claim matrix

| Bonus                           | Implementation status                                                                                                                                                                                                                    | Judge proof                                                                                                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| IPFS deliverable storage (+5%)  | **Fully implemented and live on Sepolia.** The UI uploads job specs and milestone files; the server pins through local Kubo or Pinata; the returned `ipfs://CID` is stored on-chain. Existing IPFS and HTTPS references remain accepted. | ✅ Done 2026-09-06: public upload `ipfs://QmRHNW45…su9F` round-tripped; Job 0 milestone 1 delivery tx stores `ipfs://QmaYqH2d…SQ5kHt`, retrievable through the public gateway. |
| On-chain reputation (+5%)       | **Fully implemented; counters live.** A release adds one released milestone; a job adds five bonus points only when every milestone is released and none refunded. No subjective rating exists.                                          | Live: `getReputation(contributor)` = `2 / 0 / 2` after Job 0 (refunded job correctly excluded). Remaining: one clean fully released job for the `+5` completion bonus.         |
| ERC-20 stablecoin support (+5%) | **Fully implemented; suite-proven.** The 6-decimal mUSDC mock uses exact allowance, `transferFrom` funding, and `transfer` settlement while the original payable ETH function remains.                                                   | Client holds 1,000,000 mUSDC from the constructor mint. Remaining: live approve/fund/release receipts (2-minute run in DEMO.md).                                               |

“Fully implemented” above describes the repository and reproducible local proof. Do not claim a public/testnet bonus demonstration until the new contracts and frontend are deployed. The older verified contract at `0x00a5…6A18` is ETH-only.

## Presentation order

1. Show one ETH release and one disputed refund to establish the core escrow.
2. Upload a real small file and point to the returned CID in the on-chain delivery.
3. Open the completed seeded/demo contributor profile: the formula is visible beside its counters.
4. Create an mUSDC agreement: call out “approve exactly this total,” then “fund with transferFrom.”
5. End on verified source, green checks, and the caveat that mUSDC has no monetary value.

No local URL or local transaction substitutes for the rubric's testnet evidence. Automated tests and this review do not constitute a professional audit.
