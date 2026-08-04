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

## Not yet proven

- No verified Base Mainnet settle-deliver-reconcile run is recorded in this
  repository. A 402 response alone is not settlement proof.
- The configured Base seller address
  `0xA0Fef5776E934ad8798298cc53de1749B62Ca0b9` has not been reconciled here with
  the owner's declared settlement address. Do not market revenue until control
  and accounting ownership are confirmed.
- CDP Bazaar indexing is false in the live candidate response.
- The Circle/Questbook page evidence does not verify a submitted proposal.
- npm version `0.1.1` was not published by the recorded automation.
- There are no verified external integrations, paying customers, recurring
  revenue, or official endorsement in the checked evidence.

## Release drift

At this snapshot, local `main` is ahead of GitHub `main`, contains unreviewed
changes from multiple AI tools, and production does not prove it runs the local
revision. Therefore the current release state is **HOLD** until the candidate is
clean, reproducible, reviewed, pushed, and deployed with provenance.

## Allowed public wording

> LedgerGuard is a non-custodial transaction-intent control layer in public
> preview. Arc Testnet preflight and evidence are live. A bounded Base Mainnet
> x402 challenge is enabled, while independently reproducible settlement and
> external commercial adoption remain unproven.
