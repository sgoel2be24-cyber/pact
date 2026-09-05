# Pact — stretch-build specification

HackBlox 2026 · Web3 PS01

## Product promise

Fund work upfront in ETH or a stablecoin-style token, attach durable evidence, and build an objective payment history as milestones are released.

## Acceptance criteria

1. Native ETH behavior and its existing `createJob` interface remain operational.
2. An ERC-20 job requires a conventional deployed token, prior allowance, and an exact `transferFrom` deposit equal to 2–3 positive milestone amounts.
3. A fee-on-transfer deposit cannot create a funded job.
4. Release/refund sends the job's own asset and cannot settle twice or spend another milestone's allocation.
5. Only a successful release increases the freelancer's released-milestone counter.
6. A completed-job counter increases only when every allocation in that job reaches the freelancer and none is refunded.
7. The contract returns both counters and the deterministic score `released + 5 × completed`.
8. A user can upload a job specification or deliverable of at most 4 MB, receive a validated IPFS CID, and place the resulting URI into the on-chain transaction.
9. Existing HTTPS and `ipfs://` references remain accepted.
10. The UI clearly labels ETH versus mUSDC and explains the token approval/funding sequence.
11. Pending, confirmed, rejected, and failed wallet operations remain visible.
12. All prior access-control, invalid-state, exact-accounting, reverting-recipient, and reentry tests stay green.

## Deliberate limits

- MockUSDC is a public faucet token with no value, peg, reserve, issuer guarantees, or production purpose.
- Arbitrators remain trusted humans. The score does not judge quality and is gameable through colluding wallets.
- IPFS persistence depends on a continuing local or hosted pin. Uploaded content is public and cannot be removed from the on-chain reference.
- No inactivity timeout, mutual cancellation, appeal, identity system, upgrade proxy, or admin owner is added.
