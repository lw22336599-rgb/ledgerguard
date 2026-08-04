# Project status and claim register

Snapshot: 2026-08-04. This file is the source for public product claims.

## Confirmed

- Arc Testnet health and readiness return HTTP 200 with chain ID `5042002`.
- Arc Mainnet is disabled in the network registry; the 5042 monitor is read-only
  shadow observation and cannot sign, submit, or charge.
- The Base Mainnet paid evidence endpoint currently returns an x402 `402`
  challenge and the production-candidate endpoint reports its configuration
  gates enabled.
- npm package `@ledgerguard1/sdk` version `0.1.0` exists.
- The public repository is MIT licensed.
- A protocol-neutral control envelope, Risk Signal Profile v1 draft,
  machine-readable self-test fixtures, and privacy-safe telemetry schema exist.
- A project-party Base Mainnet self-test recorded four successful transactions
  and returned its test USDC. This proves only that the preflight and ordinary
  onchain transfer path can be exercised; it is not an x402 settlement,
  customer payment, or revenue.

## Not yet proven

- No verified Base Mainnet x402 settle-deliver-reconcile run is recorded in
  this repository. A 402 response and a separate wallet self-transfer are not
  settlement proof.
- The configured Base seller address
  `0xA0Fef5776E934ad8798298cc53de1749B62Ca0b9` has not been reconciled here with
  the owner's declared settlement address. Do not market revenue until control
  and accounting ownership are confirmed.
- CDP Bazaar indexing is false in the live candidate response.
- The Circle/Questbook page evidence does not verify a submitted proposal.
- npm version `0.1.1` was not published by the recorded automation.
- There are no verified external integrations, paying customers, recurring
  revenue, or official endorsement in the checked evidence.
- No proprietary threat-data flywheel, independent conformance program,
  upstream x402 standard acceptance, or enforceable certification mark has
  been proven.

## Real-fund test incident and quarantine

Repository evidence records project-wallet Base Mainnet self-transfer tests on
2026-08-04. The latest run returned its test USDC, but the evidence also reports
historical stranded funds. The v3 helper derived a temporary key from public
inputs, so that temporary address is permanently unsafe after publication and
must never receive assets. The tracked helper is now read-only; no repository
script may sign, fund, transfer, reconstruct keys, or be scheduled. These tests
are project-party engineering evidence, not external adoption or revenue.

## Release provenance

- GitHub `main` and the reviewed local code revision were synchronized at
  `0875f8659516ee23cb19e8ec1742d2bdb8590c6e` before the current remediation
  batch on 2026-08-04.
- GitHub CI run `30887364243` completed successfully for that revision.
- Production smoke run `30887375752` completed successfully. Its Arc 5042
  shadow observation was degraded and safely closed because an official or
  independently verified Arc Mainnet RPC/observer was unavailable.
- The local brand image `artifacts/brand/logo-selected-bold-lg.png` remains a
  user-owned uncommitted change and is not part of the reviewed release.

This removes the earlier source-control drift, but it does not change the
product gate: public mainnet activation and commercial claims remain **HOLD**
until the evidence in `docs/NEXT_STEPS.md` exists.

## Allowed public wording

> LedgerGuard is a non-custodial transaction-intent control layer in public
> preview. Arc Testnet preflight and evidence are live. A Base Mainnet adapter
> exists behind separate fail-closed gates, while independently reproducible
> settlement and external commercial adoption remain unproven.
