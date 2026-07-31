# P0 Build Gate — verified 2026-07-31

Production: https://ledgerguard-gules.vercel.app  
Commit: `2ebe5cb` (+ tooling fixes)

## Automated verification

| Check | Result |
| --- | --- |
| `npm test` (136) | PASS |
| `scripts/smoke.mjs` (production) | PASS |
| `scripts/audit-ui-modules.mjs` | PASS (0 high, 35 passes) |
| Mobile horizontal overflow (all pages) | PASS |
| POST `/v1/guard-links` → payment page | PASS (Connect wallet, Approve payment, payment-complete) |

## Build Gate pages

| URL | Marker |
| --- | --- |
| `/` | Send and receive USDC, dual CTA, FAQ |
| `/pay` | Pay with USDC |
| `/guard/create` | Create a payment link |
| `/payments` | Check whether a payment arrived |
| `/testnet-help` | Set up your wallet |

## Promotion copy (ready, not auto-posted)

- Tweet: `artifacts/r1-promo/tweet-draft.txt`
- Discord: `artifacts/community/arc-discord-post.txt`
- Grant: `docs/GRANT_APPLICATION_COPYPASTE.md`

## Known limits (not blockers)

- End-to-end wallet payment requires user MetaMask + Arc Testnet USDC (cannot automate without wallet).
- 0 external verified users; promotion not yet sent by design.
- Grant submission is manual on Circle portal.
