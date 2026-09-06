# Submission readiness

Status: all three bonus features are implemented and locally verified. The bonus contracts are deployed on Sepolia and source-verified on Blockscout, the public configuration is confirmed in production, public IPFS upload round-trips succeeded, and a complete three-role ETH lifecycle (fund → IPFS evidence → two releases → dispute → arbitrator refund) is live on Sepolia with receipts. The mUSDC receipts and the reputation completion bonus remain test-proven pending one short live run. Full audit: [FINAL-VERIFICATION.md](FINAL-VERIFICATION.md).

## Verified in the current source

- [x] Original native ETH create, deliver, approve, dispute, release, and refund path preserved.
- [x] ERC-20 funding uses exact allowance plus `transferFrom`; settlement uses SafeERC20 transfer.
- [x] Exact-balance check rejects fee-on-transfer funding.
- [x] MockUSDC is explicitly valueless, has 6 decimals, and supports testnet minting.
- [x] Reputation counts only released milestones and fully released, zero-refund jobs.
- [x] Score formula is on-chain and visible in the UI: `milestones + 5 × jobs`.
- [x] Job-spec and delivery upload controls pin files and populate `ipfs://CID` references.
- [x] Direct HTTPS and existing `ipfs://` references remain supported.
- [x] Upload route keeps credentials server-side, caps files at 4 MB, validates CIDs, checks origin, and rate-limits best-effort.
- [x] Local deployment creates both contracts; seed creates ETH and completed mUSDC evidence.
- [x] 18 contract scenarios and 2 IPFS route scenarios pass.
- [x] Typecheck, formatting, production build, and local browser inspection pass.

## Required before claiming live Sepolia bonuses

- [x] Deploy the new MockUSDC and PactEscrow on Sepolia. (Bytecode re-confirmed identical to local compilation, 2026-09-06.)
- [x] Verify both contracts' source publicly from `artifacts/standard-input.json`. ([PactEscrow](https://eth-sepolia.blockscout.com/address/0xc90DdE1971272b2F074F79D9fd4e9d650C1A0d04?tab=contract) and [MockUSDC](https://eth-sepolia.blockscout.com/address/0xfFBE3fb8Dc690af8a1023497176E053e8510040D?tab=contract) on Blockscout Sepolia, compiler `v0.8.28+commit.7893614a`, optimizer 200, EVM cancun. Etherscan needs a user-owned API key; run `node scripts/verify-etherscan.mjs <key>` to finish that mirror.)
- [x] Update `deployments/sepolia.json` and all five `NEXT_PUBLIC_*` Vercel variables. (Values re-verified in production, 2026-09-06.)
- [x] Add `PINATA_JWT` to Vercel as a server-only secret and redeploy. (Sensitive production variable present; proven working by the public upload below.)
- [x] Confirm a public upload returns a retrievable CID **and store one in a Sepolia delivery**. (`ipfs://QmRHNW45…su9F` round-trip; Job 0 milestone 1 delivery tx [`0x966c2b0a…3e2392`](https://sepolia.etherscan.io/tx/0x966c2b0a9a26fc7cb4c0d057aac2103fda44fb2be7f52c199629066b3f3e2392) stores `ipfs://QmaYqH2dCswJ2zu61WwcxtLmhUY8uGF2gkDSJLQ4SQ5kHt`; a second UI upload is stored in milestone 3.)
- [x] Confirm ETH fund, release ×2, dispute, and arbitrator refund receipts with balance changes (Job 0; see [FINAL-VERIFICATION.md](FINAL-VERIFICATION.md) §6b).
- [ ] Confirm **mUSDC** approve, fund, release, and refund receipts with balance changes. (Not executed — session time call. ERC-20 exactness is covered by the passing suite; the 2-minute runbook is in [DEMO.md](DEMO.md).)
- [ ] Complete a fully released, zero-refund job and capture its on-chain reputation result. (Live counters are `2 released / 0 completed / score 2` from Job 0's releases; the `+5` completion bonus is test-proven and ships with the mUSDC add-on run.)
- [x] Recheck all three MetaMask roles on the public build. (All three roles connected and transacted live on Job 0; wrong-role calls revert on-chain — §10 of FINAL-VERIFICATION.md. Desktop and mobile viewports re-verified with zero console errors.)
- [x] Record the new verified-contract links in this document; the UI already follows its configured address.
- [ ] Record the final demo and enter the submission links.

## Historical evidence (superseded for bonus claims)

- Public ETH-only app: https://pact-ten-gamma.vercel.app
- Verified ETH-only contract: https://sepolia.etherscan.io/address/0x00a549b25930B10f4DC9e102b5bb407812c66A18#code
- Prior live inputs and receipts: [LIVE-EVIDENCE.md](LIVE-EVIDENCE.md)

Keep this evidence as proof that the original flow worked, but do not present it as proof of the new ABI, token, reputation, or IPFS upload route.
