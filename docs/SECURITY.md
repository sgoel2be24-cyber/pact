# Security best-practices review

Reviewed September 6, 2026 against the Solidity payment paths and the Next.js/React upload and wallet boundaries.

## Executive summary

No known critical, high, or medium application-security finding remains in the reviewed scope. Contract tests cover authorization, state transitions, reentry, rejected recipients, exact ERC-20 deposits, and reputation rollback behavior. This is not a professional smart-contract audit.

## Low

### SEC-001 — Public demo uploads can consume the pinning quota

- **Location:** `app/api/ipfs/route.ts`, `POST`
- **Evidence:** the route intentionally has no user authentication so judges can upload; it accepts same-origin requests up to 4 MB and applies an in-memory per-IP limit.
- **Impact:** an automated client can omit/spoof browser-origin context and distribute requests across IPs or serverless instances, consuming free-tier storage or bandwidth.
- **Fix for production:** require authenticated, short-lived upload grants backed by a durable distributed rate limiter and provider quotas.
- **Current mitigation:** 4 MB maximum, CID validation, same-origin browser check, five-request best-effort limit, secret kept server-side, and explicit recommendation to rotate/disable `PINATA_JWT` after judging.
- **False-positive note:** upstream Pinata/Vercel limits may further reduce exposure, but they are not visible in this repository.

## Informational trust boundaries

- `PactEscrow` can technically receive any ERC-20. The UI exposes only the configured mock token. A malicious or nonstandard token can lie, revert, or make only its own jobs unusable; fee-on-transfer funding is explicitly rejected.
- Reputation is deterministic but Sybil/collusion-prone. It represents released payments, not verified identity or quality.
- IPFS is public and content-addressed, not an antivirus, moderation, or guaranteed-permanence service.
- Security headers deny framing/object embedding, disable unnecessary browser permissions, set `nosniff`, and restrict referrers. React renders on-chain text through ordinary escaped JSX, and external references are limited to HTTPS or validated IPFS paths.
