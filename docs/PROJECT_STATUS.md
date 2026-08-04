# Project status and claim register

Snapshot: 2026-08-04. This file is the source for public product claims.

## Confirmed

- Arc Testnet health and readiness return HTTP 200 with chain ID `5042002`.
- Arc Mainnet is disabled in the network registry; the 5042 monitor is read-only
  shadow observation and cannot sign, submit, or charge.
- The Base Mainnet paid evidence endpoint currently returns an x402 `402`
  challenge and the production-candidate endpoint reports its configuration
  gates enabled.
- npm package `@ledgerguard1/sdk` version `0.1.1` is publicly available. A
  clean temporary project installed it and imported `LedgerGuardClient` on
  2026-08-04.
- GitHub release `sdk-v0.1.1` points to the public package. Version `0.1.1` was
  published manually and therefore does not prove the new OIDC Trusted
  Publishing path or carry that path's provenance evidence.
- Official MCP Registry metadata in `server.json` passes the Registry publisher
  validation. It has not been published because Registry login and acceptance
  of its terms remain owner-controlled actions.
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
- npm Trusted Publishing is not yet proven by a successful release. The
  repository contains the intended `publish-sdk.yml` workflow and the GitHub
  `npm-production` environment. Saving the matching npm Trusted Publisher
  connection reached npm's required security-key challenge on 2026-08-04 and
  remains owner-authentication gated. The next intentional version must still
  validate OIDC publication and provenance.
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

- Code-bearing release commit `84db24f3eaf5ae6b8062bdee6d39728a967722d9`
  passes GitHub CI run `30911222063` and production smoke run `30911365837`.
- The release passes 194 automated tests, conformance tests, TypeScript
  checking, production build, SDK clean-room installation, local smoke, and
  production-dependency audit with zero reported vulnerabilities.
- The browser acceptance suite passes 31 checks with zero reported UI issues.
- Production smoke confirms Arc Testnet readiness, public Sandbox pricing,
  fail-closed mainnet controls, and the x402 test challenge. Arc 5042 shadow is
  degraded and safely closed because its configured sources do not meet the
  independent-source agreement threshold.

- Public release evidence: npm `@ledgerguard1/sdk@0.1.1`, GitHub release
  `sdk-v0.1.1`, and repository commit `99c9192` recording clean-room
  installation. Download counts, clone counts, and project-party checks are not
  external-adoption evidence.

These checks do not change the product gate: public mainnet activation and
commercial claims remain **HOLD** until the evidence in `docs/NEXT_STEPS.md`
exists.

## Allowed public wording

> LedgerGuard is a non-custodial transaction-intent control layer in public
> preview. Arc Testnet preflight and evidence are live. A Base Mainnet adapter
> exists behind separate fail-closed gates, while independently reproducible
> settlement and external commercial adoption remain unproven.
