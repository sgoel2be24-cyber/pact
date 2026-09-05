# Judging evidence — HackBlox Web3 PS01

Source: official rubric screenshot provided by Shikhar, September 5, 2026. These are judging weights, not scores earned by Pact.

| Criterion                         | Weight | Current evidence                                                                                                                                                                                  | Required before submission                                                                                                                                 |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Working demo on testnet           | 40%    | Exact-match source-verified Sepolia contract; live Agreement #001 funded with 0.025 ETH                                                                                                           | Public frontend; real Sepolia delivery, release, dispute and refund transactions for the full journey                                                      |
| Contract correctness and security | 25%    | One core contract; role checks; state validation; exact milestone allocations; OpenZeppelin reentrancy guard; 12 passing adversarial and lifecycle test scenarios; Etherscan exact bytecode match | Re-run checks on final source and preserve the verified explorer/build evidence; document trust boundaries and test commands                               |
| UI / UX and wallet flow           | 20%    | Responsive workspace, participant-specific actions, confirmations and event history; missing-wallet setup instructions                                                                            | Real MetaMask connection, account/network changes, rejected requests, insufficient test ETH and pending transaction states checked in the final deployment |
| Creativity and bonus features     | 15%    | Open-source contributor use case and evidence-centered arbitration; existing HTTPS/IPFS references supported                                                                                      | Prefer one complete IPFS evidence feature after the core live journey works. Existing CID support alone is not a completed upload/pinning integration      |

## Delivery order

1. Guide Shikhar through creating a dedicated test wallet in regular Chrome, enabling Sepolia, and obtaining free test ETH. Do not assume prior blockchain knowledge.
2. Deploy the tested contract and verify its source on Sepolia's explorer.
3. Configure and publish the frontend for Sepolia, then exercise all three roles with real testnet transactions.
4. Publish the source repository with tests, reproducible instructions, and clearly stated limitations.
5. Finish one relevant bonus if the live core is stable. IPFS is first; reputation and stablecoins are deferred.
6. Record the 2–3 minute walkthrough and assemble the four required submission links.

## Required submission artifacts

- Public GitHub repository: contracts, frontend and tests.
- Verified Sepolia contract explorer URL.
- Public deployed frontend URL.
- 2–3 minute demonstration video or live walkthrough.

No local URL or local transaction substitutes for testnet evidence. Passing tests does not imply a security audit or guarantee a judge's score.

## Scope protection

Keep one core contract, one frontend and wallet integration. The rubric's owner/arbitrator wording describes appropriate access control; it does not require adding an unnecessary global owner. Quadratic voting and issuer hierarchies belong to other problem statements and are not relevant to freelance escrow.

## Presentation priorities

Show the live transaction and updated protected balance first. Demonstrate one approved milestone and one disputed/refunded milestone. Show that the third allocation remains protected. Explain the trusted arbitrator in one sentence. End with the verified contract, public repository and tests. Show a bonus only if it works end to end.
