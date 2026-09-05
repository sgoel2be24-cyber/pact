# Two-minute demo

Use the local role selector during development. For final judging, demonstrate the same flow on Sepolia with separately connected test wallets. Never present local transactions as Sepolia transactions.

1. **The promise (15 seconds):** “A client funds the job before work starts. The developer gets paid per approved milestone. Disagreements have a named decision-maker and a visible record.” Show the funded total and three protected allocations.
2. **The delivery (20 seconds):** select Contributor; submit an actual public commit or deliverable reference for milestone one.
3. **The payout (25 seconds):** select Client; inspect the evidence; approve and release. Show the confirmed transaction, 0.012 ETH released, and 0.013 ETH still protected.
4. **The disagreement (35 seconds):** submit milestone two as Contributor. As Client, dispute it with a specific acceptance-criteria failure. As Arbitrator, review both references and refund the client with an explanation.
5. **The evidence (25 seconds):** show 0.008 ETH refunded and the final 0.005 ETH still protected. Point to the activity trail. Close with the tests and verified Sepolia contract.

Fallback: if a public RPC is unavailable, identify the local chain explicitly and show the same contract flow there; do not imply the testnet deployment is working when it is not.
