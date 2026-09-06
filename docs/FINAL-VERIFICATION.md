# Final end-to-end verification — HackBlox 2026

- **Verification date:** 2026-09-06 (UTC)
- **Commit:** `23ef6d29e3b80668ac325897ffbfe9d4e2dbeda9` (`main`, clean tree, matches `origin/main`)
- **Public app:** https://pact-ten-gamma.vercel.app
- **Network:** Sepolia, chain ID `11155111`
- **PactEscrow:** [`0xc90DdE1971272b2F074F79D9fd4e9d650C1A0d04`](https://sepolia.etherscan.io/address/0xc90DdE1971272b2F074F79D9fd4e9d650C1A0d04) — deployed block `11643433`, tx [`0x1dddbfb8…428735`](https://sepolia.etherscan.io/tx/0x1dddbfb8f8f0785b124c88501c8686f8a575a01e2f0f7a3356690fc2ec428735)
- **MockUSDC (mUSDC, valueless 6-decimal test token):** [`0xfFBE3fb8Dc690af8a1023497176E053e8510040D`](https://sepolia.etherscan.io/address/0xfFBE3fb8Dc690af8a1023497176E053e8510040D) — deployed block `11643431`, tx [`0x07dbe9b5…78cfcf`](https://sepolia.etherscan.io/tx/0x07dbe9b5dd7aaa5242f9aaefa6807e65e0bd3f12cee0f3be172809a2a678cfcf)

## 1. Repository verification (2026-09-06)

| Check                        | Result                                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| `git status` / branch        | PASS — `main`, clean, equals `origin/main` at `23ef6d2`                                                   |
| `npm ci`                     | PASS — 0 vulnerabilities                                                                                  |
| `npm run format:check`       | PASS — all matched files use Prettier style                                                               |
| `npm run compile`            | PASS — solc `0.8.28+commit.7893614a`                                                                      |
| `npm test`                   | PASS — 18/18 escrow scenarios + 2/2 IPFS route tests                                                      |
| `npm run typecheck`          | PASS — `tsc --noEmit` clean                                                                               |
| `npm run build`              | PASS — production build, `/`, `/deploy`, `/api/ipfs`                                                      |
| `npm audit`                  | PASS — 0 vulnerabilities                                                                                  |
| GitHub Actions (latest push) | PASS — [run 33998096214](https://github.com/sgoel2be24-cyber/pact/actions/runs/33998096214) for `23ef6d2` |

## 2. Deployment and bytecode verification

- `deployments/sepolia.json` matches the chain: `chainId` 11155111, escrow block 11643433, both deploy receipts `status: 0x1`.
- Deployed bytecode fetched over `https://ethereum-sepolia-rpc.publicnode.com` **exactly matches** locally compiled `deployedBytecode` from `artifacts/PactEscrow.json` (8188 bytes) and `artifacts/MockUSDC.json` (1862 bytes), including the solc 0.8.28 metadata trailer.
- Both contracts deployed by the Client wallet `0xe0097C19b3b173A87D4209fc1982ACaD5897A2F3`.

## 3. Explorer source verification

Verified with compiler `v0.8.28+commit.7893614a`, optimizer enabled, 200 runs, EVM `cancun`, from `artifacts/standard-input.json`:

- **PactEscrow** — [verified source on Blockscout Sepolia](https://eth-sepolia.blockscout.com/address/0xc90DdE1971272b2F074F79D9fd4e9d650C1A0d04?tab=contract) (settings confirmed via explorer API; source carries `SPDX-License-Identifier: MIT`)
- **MockUSDC** — [verified source on Blockscout Sepolia](https://eth-sepolia.blockscout.com/address/0xfFBE3fb8Dc690af8a1023497176E053e8510040D?tab=contract) (verified 2026-09-06, license MIT)

Etherscan (`sepolia.etherscan.io`) verification requires a user-owned Etherscan API key, which is not available to automated tooling. Exact manual command (from the repo root, with a free key from https://etherscan.io/myapikey):

```sh
node scripts/verify-etherscan.mjs <ETHERSCAN_API_KEY>   # submits artifacts/standard-input.json for both contracts
```

or by hand: Etherscan → contract page → Verify and Publish → "Standard JSON Input", compiler `v0.8.28+commit.7893614a`, optimization **Yes** / 200 runs, EVM `cancun`, no constructor arguments, license MIT, upload `artifacts/standard-input.json`, contract `PactEscrow.sol:PactEscrow` / `MockUSDC.sol:MockUSDC`.

## 4. Vercel production configuration

Confirmed against the live project (`codes-projects-48d92751/pact`, production environment):

| Variable                        | Expected / status                                                        | Verified |
| ------------------------------- | ------------------------------------------------------------------------ | -------- |
| `NEXT_PUBLIC_CHAIN_ID`          | `11155111`                                                               | ✅       |
| `NEXT_PUBLIC_CONTRACT_ADDRESS`  | `0xc90DdE1971272b2F074F79D9fd4e9d650C1A0d04`                             | ✅       |
| `NEXT_PUBLIC_MOCK_USDC_ADDRESS` | `0xfFBE3fb8Dc690af8a1023497176E053e8510040D`                             | ✅       |
| `NEXT_PUBLIC_DEPLOY_BLOCK`      | `11643433`                                                               | ✅       |
| `NEXT_PUBLIC_RPC_URL`           | `https://ethereum-sepolia-rpc.publicnode.com` (responds; used for reads) | ✅       |
| `PINATA_JWT`                    | server-only Sensitive variable, present; proven working by §5            | ✅       |

The served production bundle at https://pact-ten-gamma.vercel.app contains the same chain ID, deploy block, and both contract addresses (checked in the delivered JS), and the page returns HTTP 200.

## 5. Public IPFS upload

- **Test file (45 bytes):** `Pact HackBlox 2026 public IPFS verification.`
- **Request:** browser-equivalent `multipart/form-data` POST to `https://pact-ten-gamma.vercel.app/api/ipfs` with field `file` and matching `Origin` header.
- **Result:** HTTP 200 → `{"cid":"QmRHNW45XjbVUhQamNRF1UozHNS3mg4myToZgqnZyRsu9F","uri":"ipfs://QmRHNW45XjbVUhQamNRF1UozHNS3mg4myToZgqnZyRsu9F"}`
- **Retrieval:** exact content retrieved from the public Pinata gateway: https://gateway.pinata.cloud/ipfs/QmRHNW45XjbVUhQamNRF1UozHNS3mg4myToZgqnZyRsu9F
- **Note:** at verification time `ipfs.io`/`dweb.link`/`w3s.link` are migrating to service-worker gateways (HTTP 429) and the trustless gateway had not yet seen DHT provider records for this fresh pin. The CID is valid (CIDv0, 46 chars) and publicly retrievable through Pinata's gateway; wider propagation typically follows.

## 6. Role wallets (Sepolia)

| Role        | Address                                      | Sepolia ETH | mUSDC     |
| ----------- | -------------------------------------------- | ----------- | --------- |
| Client      | `0xe0097C19b3b173A87D4209fc1982ACaD5897A2F3` | ~0.0233     | 1,000,000 |
| Contributor | `0x4A247eed198914cD0c00E222B1D524F481efE62c` | 0.003       | 0         |
| Arbitrator  | `0xBB9E16Be9A27cCe113aa8b42fe04EB287528D3d5` | 0.003       | 0         |

- **mUSDC mint evidence:** the Client received the full 1,000,000 mUSDC supply in the MockUSDC constructor mint — tx [`0x07dbe9b5dd7aaa5242f9aaefa6807e65e0bd3f12cee0f3be172809a2a678cfcf`](https://sepolia.etherscan.io/tx/0x07dbe9b5dd7aaa5242f9aaefa6807e65e0bd3f12cee0f3be172809a2a678cfcf) (`Transfer(0x0 → Client, 1000000e6)`, block 11643431). `mint(address,uint256)` remains public for top-ups; the Client already holds far more than the 220 mUSDC needed below.
- Contributor reputation before the live runs: `0 released / 0 completed / 0 score`.

## 6b. Live ETH escrow flow — Job 0 (original path, 3 milestones)

- **Job 0** `Pact Website Delivery` — scope `HackBlox 2026 end-to-end verification agreement.`
- Milestones: `Implementation` 0.001 ETH · `Tests and review` 0.008 ETH · `Documentation` 0.005 ETH (total locked 0.014 ETH)
- Client `0xe0097C19…A2F3`, Contributor `0x4A247eed…fE62c`, Arbitrator `0xBB9E16Be…28D3d5`
- **Funding tx:** [`0x544dd4dec76d51b8ded3f8bb4d720f46a5eb10d6a4b7bfd34c22ef89b1f050c1`](https://sepolia.etherscan.io/tx/0x544dd4dec76d51b8ded3f8bb4d720f46a5eb10d6a4b7bfd34c22ef89b1f050c1) (block 11644291, `JobCreated` jobId 0)

| Step                                          | Tx                                                                                                                                          | Status                                                                                                                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1 delivery with IPFS evidence (Contributor)  | [`0x966c2b0a…3e2392`](https://sepolia.etherscan.io/tx/0x966c2b0a9a26fc7cb4c0d057aac2103fda44fb2be7f52c199629066b3f3e2392) (block 11644314)  | ✅ `MilestoneDelivered(0, 0, ipfs://QmaYqH2dCswJ2zu61WwcxtLmhUY8uGF2gkDSJLQ4SQ5kHt)` — file uploaded through the app's **Upload & pin a file** control; [retrievable on the public gateway](https://gateway.pinata.cloud/ipfs/QmaYqH2dCswJ2zu61WwcxtLmhUY8uGF2gkDSJLQ4SQ5kHt) |
| M1 approve → 0.001 ETH released (Client)      | [`0x877bd86c…399526f`](https://sepolia.etherscan.io/tx/0x877bd86c4035663d5f3ccfbc55675b1c73cd35db4bb7f3deac6665fbb399526f) (block 11644323) | ✅ `MilestoneSettled(0, 0, Contributor, 0.001 ETH, Released)`; job: released 0.001 / refunded 0 / protected 0.013 ETH                                                                                                                                                         |
| M2 delivery (Contributor)                     | [`0xa2ea2eb2…6f36f3`](https://sepolia.etherscan.io/tx/0xa2ea2eb24fc827c806fdfa98e8ea07e9be6c83b13f51f5a340400a2ff56f36f3) (block 11644332)  | ✅ evidence = pasted CI-run HTTPS reference (direct-link path)                                                                                                                                                                                                                |
| M2 approve → 0.008 ETH released (Client)      | [`0x4bf4f581…3f2cec`](https://sepolia.etherscan.io/tx/0x4bf4f58101d379bd04b68eaf177c090898e53fe330b20f1d2a9acd8e2b3f2cec) (block 11644337)  | ✅ released 0.009 / refunded 0 / protected 0.005 ETH; reputation `2 released / 0 completed / score 2`                                                                                                                                                                         |
| M3 delivery (Contributor)                     | [`0x29fed0cc…0e0686`](https://sepolia.etherscan.io/tx/0x29fed0cc12b564f124e5168b43a755d4c49a0a74524e3c4664d30af0610e0686) (block 11644353)  | ✅ evidence = `ipfs://QmVsV6YPymSU2vJt6dPLRkcYGJ4wSKkeRyzKBn5NmcZRHv` (UI upload; [gateway copy](https://gateway.pinata.cloud/ipfs/QmVsV6YPymSU2vJt6dPLRkcYGJ4wSKkeRyzKBn5NmcZRHv))                                                                                           |
| M3 dispute (Client)                           | [`0xfce29cf5…9d9189`](https://sepolia.etherscan.io/tx/0xfce29cf509e168c71b0657057b8d6c7ea43c1cf1d4da7a9bb85ab3760e9d9189) (block 11644360)  | ✅ reason stored on-chain: "The final documentation does not yet meet the agreed acceptance criteria."                                                                                                                                                                        |
| M3 arbitrator refund → 0.005 ETH (Arbitrator) | [`0x6b227d3d…5d55f7`](https://sepolia.etherscan.io/tx/0x6b227d3d86716d0a8be060bc0eaa35d357e1fe9753d65155358aafd1555d55f7) (block 11644367)  | ✅ `MilestoneSettled(0, 2, Client, 0.005 ETH, Refunded)`; decision stored verbatim on-chain                                                                                                                                                                                   |

**Job 0 final state:** released **0.009 ETH** (M1 0.001 + M2 0.008), refunded **0.005 ETH** (M3), protected **0**. Contributor reputation after this disputed job: `2 released / 0 completed / score 2` — the refunded job correctly does **not** count as completed. Escrow contract ETH balance back to 0.

## 7. Live mUSDC escrow flow — NOT EXECUTED (time call during the session)

The live mUSDC walkthrough (exact `approve` → `createTokenJob` funding → token release/refund receipts) was **not run on Sepolia in this session**; the wallet owner stopped the flow for time. Do not present it as live-proven.

What **is** proven for the ERC-20 path:

- Both contracts deployed on Sepolia with bytecode identical to this source (§2), source-verified (§3).
- The Client holds **1,000,000 mUSDC** from the constructor mint — tx [`0x07dbe9b5…78cfcf`](https://sepolia.etherscan.io/tx/0x07dbe9b5dd7aaa5242f9aaefa6807e65e0bd3f12cee0f3be172809a2a678cfcf). `mint(address,uint256)` is public for top-ups.
- The automated suite passes 18/18 scenarios, including `ERC-20 funding requires allowance and escrows the exact approved total`, `ERC-20 release and refund transfer exact milestone amounts without touching ETH`, and fee-on-transfer rejection.
- The dispute + refund lifecycle is proven live on the ETH path (§6b) with the exact judge-facing reason and decision strings.

To run the live mUSDC proof later (5–6 MetaMask confirmations, ~2 minutes): create a 2-milestone mUSDC agreement (e.g. 125 + 75), deliver both milestones as Contributor, approve both as Client. Receipts then slot into this table:

| Step                               | Tx  | Status       |
| ---------------------------------- | --- | ------------ |
| mUSDC `approve` + `createTokenJob` | —   | not executed |
| M1/M2 delivery + release receipts  | —   | not executed |

## 8. Dispute and refund — LIVE on ETH (Job 0, milestone 3)

Executed with the judge-facing strings; see §6b: dispute tx [`0xfce29cf5…9d9189`](https://sepolia.etherscan.io/tx/0xfce29cf509e168c71b0657057b8d6c7ea43c1cf1d4da7a9bb85ab3760e9d9189), arbitrator refund tx [`0x6b227d3d…5d55f7`](https://sepolia.etherscan.io/tx/0x6b227d3d86716d0a8be060bc0eaa35d357e1fe9753d65155358aafd1555d55f7) returning 0.005 ETH to the Client. The mUSDC-denominated refund variant remains test-proven only (§7).

## 9. Reputation — partially live

- Live on-chain now (read 2026-09-06): `getReputation(0x4A247eed…fE62c)` = **2 released milestones / 0 completed jobs / score 2**, emitted via `ReputationUpdated` events in the two release txs. The disputed/refunded Job 0 correctly did **not** increment completed jobs.
- The `+5` completed-job bonus (score `2 + 5 = 7` for a clean two-milestone job) is **test-proven** (`reputation counts releases and only fully successful jobs with a transparent score`) but has **no live Sepolia receipt** — it needs one fully released, zero-refund job (see §7).

## 10. Role permissions

Read-only `eth_call` simulations against the **live** Sepolia contract (2026-09-06), all reverting as designed:

| Attempt                                | Result             |
| -------------------------------------- | ------------------ |
| Client calls `deliver`                 | `Unauthorized`     |
| Contributor calls `approve`            | `Unauthorized`     |
| Client calls `resolve`                 | `Unauthorized`     |
| Contributor calls `dispute`            | `Unauthorized`     |
| Arbitrator calls `approve`             | `Unauthorized`     |
| Client re-approves a settled milestone | `InvalidState`     |
| Contributor re-delivers a refunded one | `InvalidState`     |
| `createJob` with wrong `msg.value`     | `IncorrectFunding` |

UI gating: action buttons render only for the connected account's role; other roles see "Waiting for …". With no wallet connected, creation and actions are disabled and a guidance toast appears ([no-wallet-toast.png](final-evidence/no-wallet-toast.png)). The 18-scenario suite covers the same matrix with adversarial recipients and reentrancy.

## 11. Public UI verification (2026-09-06)

| Check                                                   | Desktop                                                             | Mobile (390×844)                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Page loads, HTTP 200                                    | ✅                                                                  | ✅                                                                                                     |
| Uncaught console errors                                 | none                                                                | none                                                                                                   |
| Endless loaders                                         | none (loader resolves)                                              | none                                                                                                   |
| Sepolia network label                                   | ✅                                                                  | ✅                                                                                                     |
| Correct PactEscrow link in "Project proof"              | ✅                                                                  | ✅                                                                                                     |
| mUSDC labeling (guide + asset copy)                     | ✅                                                                  | ✅                                                                                                     |
| No-wallet state shows guidance toast, controls disabled | ✅                                                                  | —                                                                                                      |
| Job 0 detail: statuses, totals, dispute text            | [job0-settled-desktop.png](final-evidence/job0-settled-desktop.png) | ✅                                                                                                     |
| Activity timeline (8 entries, all with tx links)        | ✅ 8 `sepolia.etherscan.io/tx/…` links                              | —                                                                                                      |
| Reputation card ("2 points · 2 released · 0 completed") | ✅                                                                  | —                                                                                                      |
| IPFS evidence links open content                        | ✅ via Pinata gateway (see §12 note)                                | —                                                                                                      |
| Layout / controls                                       | [desktop-home.png](final-evidence/desktop-home.png)                 | [mobile-home.png](final-evidence/mobile-home.png), [mobile-guide.png](final-evidence/mobile-guide.png) |

## 12. Limitations

- The live mUSDC approve/fund/release receipts and the live reputation completion bonus were not executed (§7, §9). Everything else is on-chain and linked above.
- Etherscan verification awaits a user-owned API key (Blockscout verification is complete; see §3). Run `node scripts/verify-etherscan.mjs <key>`.
- During verification, `ipfs.io` began serving a Cloudflare interstitial / service-worker-only gateway, so the app's `ipfs://` link resolver was switched to the Pinata public gateway (`lib/escrow.ts`, one line) — the same provider the upload route pins through, so app-pinned content is guaranteed to resolve. This is the only code change in this verification pass; it is included in the pushed commit.
- Fresh IPFS pins may take time to propagate to non-Pinata gateways; Pinata's gateway serves all three pinned files today (§5, §6b).
- MetaMask flagged the public URL with a caution earlier in the project; the domain is **not** on the MetaMask `eth-phishing-detect` blocklist as of 2026-09-06. If a warning appears, review it in MetaMask before proceeding.
- Testnet prototype: arbitration is trusted; mUSDC is valueless; see [SECURITY.md](SECURITY.md).
