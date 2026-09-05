# Judging evidence — HackBlox Web3 PS01

Source: official rubric screenshot provided by Shikhar, September 5, 2026. Weights are judging criteria, not a guaranteed score.

| Criterion                         | Weight | Verified in this source build                                                                                     | Still required for public proof                                                |
| --------------------------------- | -----: | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Working demo on testnet           |    40% | Complete local ETH and mUSDC flows; real local transactions                                                       | Redeploy stretch contracts, update Vercel, complete three-role Sepolia journey |
| Contract correctness and security |    25% | Exact allocation, role/state checks, CEI, reentrancy guard, SafeERC20, fee-token rejection, 18 contract scenarios | Verify new PactEscrow and MockUSDC source on Etherscan                         |
| UI / UX and wallet flow           |    20% | Asset-aware amounts, two-step token feedback, IPFS controls, reputation display, local browser inspection         | Repeat wallet and responsive checks on the new public deployment               |
| Creativity and bonus features     |    15% | All three bonus implementations are complete and locally verified                                                 | Capture public IPFS retrieval and Sepolia token/reputation receipts            |

## Bonus claim matrix

| Bonus                           | Implementation status                                                                                                                                                                                                                   | Judge proof                                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| IPFS deliverable storage (+5%)  | **Fully implemented in code/local demo.** The UI uploads job specs and milestone files; the server pins through local Kubo or Pinata; the returned `ipfs://CID` is stored on-chain. Existing IPFS and HTTPS references remain accepted. | Upload a small file on the public app, open it through the gateway, then show the same URI in the agreement/delivery and transaction event. |
| On-chain reputation (+5%)       | **Fully implemented in code/local demo.** A release adds one released milestone; a job adds five bonus points only when every milestone is released and none refunded. No subjective rating exists.                                     | Complete a two-milestone job, show `2 released / 1 completed / 7 points`, then show `getReputation` on Etherscan.                           |
| ERC-20 stablecoin support (+5%) | **Fully implemented in code/local demo.** The 6-decimal mUSDC mock uses exact allowance, `transferFrom` funding, and `transfer` settlement while the original payable ETH function remains.                                             | Show approval and funding as separate Sepolia transactions, then release one mUSDC milestone and show token balance changes.                |

“Fully implemented” above describes the repository and reproducible local proof. Do not claim a public/testnet bonus demonstration until the new contracts and frontend are deployed. The older verified contract at `0x00a5…6A18` is ETH-only.

## Presentation order

1. Show one ETH release and one disputed refund to establish the core escrow.
2. Upload a real small file and point to the returned CID in the on-chain delivery.
3. Open the completed seeded/demo contributor profile: the formula is visible beside its counters.
4. Create an mUSDC agreement: call out “approve exactly this total,” then “fund with transferFrom.”
5. End on verified source, green checks, and the caveat that mUSDC has no monetary value.

No local URL or local transaction substitutes for the rubric's testnet evidence. Automated tests and this review do not constitute a professional audit.
