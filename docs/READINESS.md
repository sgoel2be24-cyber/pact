# Submission readiness

Status: all three bonus features are implemented and locally verified. The bonus contracts are deployed on Sepolia and the public configuration is updated. Public IPFS and three-role wallet receipts remain.

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

- [x] Deploy the new MockUSDC and PactEscrow on Sepolia.
- [ ] Verify both contracts on Etherscan from `artifacts/standard-input.json`.
- [x] Update `deployments/sepolia.json` and all five `NEXT_PUBLIC_*` Vercel variables.
- [ ] Add `PINATA_JWT` to Vercel as a server-only secret and redeploy.
- [ ] Confirm a public upload returns a retrievable CID and stores it in a Sepolia delivery.
- [ ] Confirm mUSDC approve, fund, release, and refund receipts with balance changes.
- [ ] Complete a fully released job and capture its on-chain reputation result.
- [ ] Recheck desktop/mobile and all three MetaMask roles on the public build.
- [ ] Record the new verified-contract links in this document; the UI already follows its configured address.
- [ ] Record the final demo and enter the submission links.

## Historical evidence (superseded for bonus claims)

- Public ETH-only app: https://pact-ten-gamma.vercel.app
- Verified ETH-only contract: https://sepolia.etherscan.io/address/0x00a549b25930B10f4DC9e102b5bb407812c66A18#code
- Prior live inputs and receipts: [LIVE-EVIDENCE.md](LIVE-EVIDENCE.md)

Keep this evidence as proof that the original flow worked, but do not present it as proof of the new ABI, token, reputation, or IPFS upload route.
