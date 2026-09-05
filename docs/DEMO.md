# Two-to-three-minute bonus demo

Use the local role selector during development. For judging, use separately connected Sepolia accounts and never describe local transactions as testnet transactions.

## Before recording

- Deploy and verify the new PactEscrow and MockUSDC.
- Configure Vercel with both public addresses and a server-only Pinata JWT.
- Mint/hold at least 250 mUSDC in the client wallet and fund all three role wallets with Sepolia ETH for fees.
- Upload one harmless file once and confirm its gateway URL opens.

## Script

1. **Core promise (20 seconds):** “Pact locks the full job upfront and settles each milestone independently in ETH or stablecoin-style tokens.” Show a funded ETH agreement.
2. **Real IPFS evidence (30 seconds):** as Contributor, open a funded milestone, choose **Upload & pin a file**, and wait for “Pinned — CID added.” Submit the populated `ipfs://...` value. Open the saved reference after confirmation.
3. **ETH safety still works (25 seconds):** as Client, approve the delivery. Show the exact released amount and another allocation still protected.
4. **Stablecoin flow (35 seconds):** create an mUSDC agreement. Narrate the two confirmations: exact ERC-20 allowance, then `transferFrom` funding. Show the agreement labeled mUSDC, not ETH.
5. **Objective reputation (25 seconds):** complete the second milestone or open the seeded completed job. Show “2 released milestones · 1 completed job · 7 points” and state the formula: one point per released milestone plus five per fully released job.
6. **Close (15 seconds):** show the verified contracts and green CI. Say: “No ratings, no paid IPFS dependency, and the original ETH escrow path remains covered.”

Fallback: if Pinata or a public RPC is unavailable, identify the local Kubo/Hardhat setup explicitly. Do not imply public availability or Sepolia success when it is not working.
