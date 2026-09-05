# Agreement #001: live evidence and exact demo inputs

This is the existing Sepolia job **0**, funded with **0.025 ETH**. Do not create another agreement or redeploy the contract. The following steps are prepared inputs, not a claim that their transactions have already happened. The dispute is an explicitly staged testnet review scenario, not a claim of failing automated tests.

## Public proof

- [Public Sepolia frontend](https://pact-ten-gamma.vercel.app)
- [Verified contract](https://sepolia.etherscan.io/address/0x00a549b25930B10f4DC9e102b5bb407812c66A18#code)
- [Repository](https://github.com/sgoel2be24-cyber/pact)
- [Passing baseline CI run](https://github.com/sgoel2be24-cyber/pact/actions/runs/33963569382) for commit `ded14f7aaca8fe3c7f44eb8884e33a66044788a9`
- [Latest CI status](https://github.com/sgoel2be24-cyber/pact/actions/workflows/ci.yml)
- [Original agreement funding transaction](https://sepolia.etherscan.io/tx/0xfd83f7f3ec4448cf9631214069f05775a84842183d625f13c067b51aa37c6eb1)

## Wallets and switching

| Role        | Existing account                             |
| ----------- | -------------------------------------------- |
| Client      | `0xe0097C19b3b173A87D4209fc1982ACaD5897A2F3` |
| Contributor | `0x4A247eed198914cD0c00E222B1D524F481efE62c` |
| Arbitrator  | `0xBB9E16Be9A27cCe113aa8b42fe04EB287528D3d5` |

Connect MetaMask on Sepolia. After changing the account, Pact clears the old signer and any open action; click **Connect wallet** again and check **Your role**. Wait for each transaction to confirm before switching. On a phone, open the public URL inside MetaMask's browser; an ordinary mobile browser without an injected wallet cannot connect through the current implementation.

## 1. Contributor delivers Implementation (milestone ID 0)

Choose **Submit delivery** on **Implementation**. Paste this immutable implementation reference into the evidence field:

```text
https://github.com/sgoel2be24-cyber/pact/tree/ded14f7aaca8fe3c7f44eb8884e33a66044788a9
```

Narration: “I am delivering the open-source escrow implementation. This pinned revision includes the contract, role-aware frontend, tests, and documentation. Its automated checks passed.”

Expected: **Delivered**; 0.025 ETH remains protected. Record the delivery transaction from **View transaction** in the activity trail.

## 2. Client approves Implementation

Switch to Client, reconnect, inspect the implementation and passing CI link, and choose **Approve & release** for **Implementation**. Approval has no text field.

Narration: “I reviewed the submitted implementation and its passing checks. I approve milestone one and release its 0.012 Sepolia ETH allocation to the contributor.”

Expected: **Released**; 0.012 ETH released, 0.013 ETH protected. Record the approval transaction and inspect its recipient and amount.

## 3. Contributor delivers Tests and review (milestone ID 1)

Switch to Contributor, reconnect, and choose **Submit delivery** on **Tests and review**. Paste:

```text
https://github.com/sgoel2be24-cyber/pact/actions/runs/33963569382
```

Narration: “I am submitting the passing automated checks as the milestone-two evidence. For this staged testnet dispute, the review packet intentionally omits a recorded three-role public-wallet walkthrough.”

Expected: **Delivered**; balances unchanged. Record the second delivery transaction.

## 4. Client disputes Tests and review

Switch to Client, reconnect, and choose **Raise a dispute** for **Tests and review**. Exact reason:

```text
Staged Sepolia demo: the submitted CI run proves automated tests passed, but this review packet omits a recorded three-role walkthrough on the public deployment. For this demonstration, I request review of that missing evidence before releasing the 0.008 ETH milestone. This is not a claim that the automated tests failed.
```

Expected: **Disputed**; 0.013 ETH remains protected. Record the dispute transaction. The Contributor and Client cannot resolve this dispute.

## 5. Arbitrator refunds Tests and review

Switch to Arbitrator, reconnect, inspect the submitted CI link and dispute reason, and choose **Refund client**. Exact decision:

```text
Staged Sepolia demo decision: the submitted automated checks passed, but the disputed review packet does not contain the requested recorded public-wallet walkthrough. For this demonstration I refund only milestone two's 0.008 ETH allocation to the client. Milestone one's approved payment and milestone three's protected funds are unaffected.
```

Expected: **Refunded**; 0.012 ETH released, 0.008 ETH refunded, and 0.005 ETH protected. Documentation remains **Funded**. Record the resolution transaction and verify the client received 0.008 ETH, excluding transaction fees paid separately by the arbitrator.

## Receipt checklist

Use actual mined transaction URLs from Pact's activity trail. Never substitute a predicted hash or local-chain receipt.

| Step                 | Sepolia receipt                                                                                                    | Status                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| Initial funding      | [0xfd83…c6eb1](https://sepolia.etherscan.io/tx/0xfd83f7f3ec4448cf9631214069f05775a84842183d625f13c067b51aa37c6eb1) | Confirmed                            |
| Milestone 1 delivery | Pending                                                                                                            | Not executed in this evidence packet |
| Client approval      | Pending                                                                                                            | Not executed in this evidence packet |
| Milestone 2 delivery | Pending                                                                                                            | Not executed in this evidence packet |
| Client dispute       | Pending                                                                                                            | Not executed in this evidence packet |
| Arbitrator refund    | Pending                                                                                                            | Not executed in this evidence packet |

IPFS upload/pinning is omitted until the public deployment and the complete live journey are verified. Existing external HTTPS/IPFS reference support remains available.
