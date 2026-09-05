# Pact — a clear agreement, a protected payment

HackBlox 2026 · Web3 PS01 · September 5, 2026

## Product promise

Fund the job upfront. Release payment milestone by milestone. Resolve disagreements with a clear record.

## One workflow

Client creates a job with a freelancer, independent arbitrator, agreement reference, and two or three priced milestones. The exact total is deposited in ETH when the job is created. Each milestone starts Funded. The freelancer submits an evidence reference, moving it to Delivered. The client either approves payment (Released) or supplies a dispute reason (Disputed). Only the designated arbitrator can resolve a dispute, releasing that milestone to the freelancer or refunding it to the client. Other milestones remain unaffected.

## Screens

- Workspace: real job list, money totals, and a clear next action.
- Job: funding breakdown, milestone cards, participants, and chronological on-chain activity. The connected wallet determines available actions.
- Create agreement: participants, scope, and 2–3 milestone titles/amounts; confirmation includes exact funding total.
- How it works: state transitions and the trusted-arbitrator boundary in plain language.

## Architecture

Frontend (Next.js + ethers) → one non-upgradeable PactEscrow Solidity contract.
MetaMask signs Sepolia transactions. No application database or central signing server. Contract state is the source of truth; event logs explain its history. Evidence is a reference to an external deliverable; IPFS CIDs are supported without requiring a hosted backend. Local demo role switching uses only disposable Hardhat accounts on a loopback development chain.

## Deliberate limits

ETH only for the first version. No token, DAO, AI adjudication, marketplace, or reputation algorithm. No automatic proof of work quality: the client and arbitrator make human judgments. All on-chain references and reasons are public; use non-sensitive demo data. No promise of production readiness. Unresponsive participants can leave funds locked; timeouts and mutual cancellation require a separately reviewed design after the hackathon core.

## Acceptance

1. The exact sum of 2–3 positive milestone amounts is locked per job.
2. Roles are distinct and nonzero; only authorized roles can perform each transition.
3. A paid or refunded milestone cannot settle twice.
4. One milestone's payout cannot spend another's allocation.
5. Failed payouts revert both settlement and accounting; reentrant payout attempts cannot duplicate release.
6. Both arbitration outcomes work with real balance changes.
7. Frontend shows pending, confirmed, rejected, and failed transaction feedback; refresh reads authoritative chain state.
8. Desktop and mobile views support the complete workflow.
9. Sepolia deployment and explorer verification remain explicit readiness gates.

## Demo in two minutes

Open a funded open-source integration agreement. Switch to contributor and submit the first deliverable. Switch to client, approve it, and show the confirmed payout. Submit milestone two and dispute it with a reason. Switch to arbitrator, review the evidence, refund the milestone, and show that milestone three is still protected. End on the activity trail and verified contract.
