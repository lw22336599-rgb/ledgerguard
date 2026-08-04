# LedgerGuard remediation status

**Current status:** 2026-08-04

**Production:** https://ledgerguard-gules.vercel.app

**Repository:** https://github.com/lw22336599-rgb/ledgerguard

This file replaces the 2026-07-31 remediation snapshot. That snapshot contained
stale Base Mainnet activation language and is not a current claims source.

## Release decision

| Area | Decision | Evidence boundary |
|---|---|---|
| Arc Testnet technical demo | GO | Automated tests and testnet flows only |
| Public SDK examples | GO with `@ledgerguard1/sdk@0.1.0` | Public `0.1.1` is not published |
| SDK `0.1.1` publication | HOLD | Requires an intentional npm release and account approval |
| Base Mainnet real funds | HOLD | `/canary` must return 503; no verified settlement |
| Arc Mainnet real funds | HOLD | Official parameters and release approval incomplete |
| Commercial launch | HOLD | No independent repeat use or paid commitment yet |
| Grant submission | HOLD | Materials must remain accurate and owner fields are incomplete |

## Current product truth

- Guard Links and payment demonstrations use Arc Testnet assets with no
  financial value.
- A Base Mainnet x402 canary implementation exists in code, but it is
  disabled by default and the public `/canary` route must remain closed.
- LedgerGuard is non-custodial and does not sign transactions or hold keys.
- Project-owner tests, bots, CI traffic, test tokens, email sends, and social
  impressions are not customers, revenue, or independent validation.

## Commercial evidence gate

Commercial status can change only after all of the following are evidenced:

1. Five qualified buyer interviews with attributable notes.
2. Three genuine redacted transaction samples supplied by external parties.
3. Two independent sandbox integrations.
4. At least one integration repeats use over a 14-day window.
5. At least one explicit paid-pilot or subscription commitment.

Until then, external claims must say **testnet technical preview**, not
production mainnet, market validation, official recognition, or revenue.

## Next controlled actions

1. Keep the public SDK examples installable from the npm version that actually
   exists.
2. Keep `/canary` fail-closed and continuously audit its 503 response.
3. Record outreach delivery failures and external replies without inflating
   them into interviews.
4. Complete independent integrations and repeat-use evidence before adding
   enterprise scope or submitting a grant application.
