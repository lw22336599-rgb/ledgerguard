# Verified next steps

Last updated: 2026-08-04

LedgerGuard remains a testnet product and a production candidate. No public document or UI may imply that a mainnet payment loop, customer demand, revenue, ecosystem endorsement, certification, or grant has been verified unless reproducible evidence is linked.

## Release gate

- [x] Deterministic preflight and evidence core
- [x] Fail-closed network configuration
- [x] Privacy-safe opt-in telemetry schema
- [x] Public Risk Signal Profile draft and self-test fixtures
- [x] SDK pack and conformance checks in CI
- [x] Public npm package `@ledgerguard1/sdk@0.1.1` and GitHub release
- [ ] First OIDC Trusted Publishing release with npm provenance
- [ ] Independent security review with no unresolved critical findings
- [ ] One complete testnet settle-deliver-reconcile trace
- [ ] Three independent developer integrations
- [ ] One integration repeats use on at least two separate days
- [ ] One written paid-pilot or subscription commitment

Until all unchecked items are evidenced, status is **HOLD for public mainnet activation**.

## Product priorities

1. Make Guard Link understandable without blockchain expertise.
2. Produce signed, replay-resistant evidence receipts.
3. Collect only consented, derived telemetry; never store raw addresses or transaction payloads in the shared learning dataset.
4. Publish a versioned, vendor-neutral risk vocabulary and conformance fixtures.
5. Validate distribution through wallet, agent, merchant, and x402 integrations.

## Asset expansion decision

- Keep Arc routes USDC-only until an official Arc USDT deployment, exact asset
  identity, decimals, transfer semantics, and facilitator compatibility are
  independently verified.
- Make the public control contract asset-neutral before adding another token:
  use CAIP-2 network IDs, stable asset IDs/addresses, `amountAtomic`, and an
  explicit decimals registry. Preserve the existing micro-USDC request fields
  as a deprecated compatibility layer during migration.
- Add USDT first as an **experimental adapter** on one verified network/token
  pair. It may not be described as production-ready until preflight, signing,
  settlement, replay protection, and evidence reconciliation all pass.
- Do not expand to every chain. A new adapter graduates only after deterministic
  fixtures, a complete test payment trace, and one independent integration.

## Integration evidence rule

Project-owned sample apps and scheduled tests may prove compatibility and
reliability, but they do not count as independent developers, repeat external
use, customer demand, or a paid commitment. Those gates require evidence from
non-project parties.

## Moat gates

- **Data flywheel:** no claim until opt-in records improve a measured benchmark against a fixed holdout set.
- **Standards position:** no claim of authority; require a public proposal, independent implementation, and upstream or ecosystem review.
- **Brand conformance:** use only “self-tested against LedgerGuard Risk Signal Profile v1” until trademark rules, independent testing, issuance, expiry, and revocation exist.
- **Closed-source assets:** enterprise controls, proprietary datasets, trained models, hosted operations, and SLA tooling belong in a separate private repository. Interoperability specifications, SDKs, adapters, and conformance fixtures remain public.

## Explicitly not now

- Public mainnet activation or real-fund automation
- Token issuance
- Custody or transaction signing
- Paid certification labels
- Claims of customers, revenue, official support, or protocol ownership
- Publishing packages, posting publicly, submitting grants, or changing
  accounts without action-time approval. The owner explicitly authorized the
  current release-hardening and evidence-led distribution work on 2026-08-04;
  that authorization does not cover legal attestations, identity claims,
  spending, wallet signatures, real-fund actions, or future unrelated posts.

## Distribution and funding queue

Every open item must link reproducible evidence before it can be checked off.

- [ ] Configure npm Trusted Publisher for `lw22336599-rgb/ledgerguard`, workflow
  `publish-sdk.yml`, environment `npm-production`, then validate it with the
  next intentional patch release.
- [ ] Revoke the previously exposed npm automation token after OIDC publishing
  succeeds; never record the token in the repository or project memory.
- [ ] Publish the verified MCP metadata to the official MCP Registry.
- [ ] Submit a truthful NTU InnovateX 2026 entry before its deadline, subject to
  the owner's final identity, team, attendance, and terms declarations.
- [ ] Add source attribution from public link to first protected request,
  evidence receipt, repeat use, and paid-pilot response.
- [ ] Complete one independently reproducible testnet settle-deliver-reconcile
  trace before requesting x402 Bazaar indexing.
- [ ] Prepare conditional applications for Startup SG Founder, Microsoft for
  Startups, Ethereum Foundation ESP, Base funding, and Circle Developer Grants;
  do not submit until each program's live eligibility and evidence gates pass.
- [ ] Launch on Product Hunt, Show HN, Reddit, or broad communities only after a
  no-signup Guard Link demo and attribution funnel pass production acceptance.

## Evidence links

- Project truth: `docs/PROJECT_STATUS.md`
- Claims policy: `docs/MESSAGING_AND_CLAIMS.md`
- Conformance policy: `docs/CONFORMANCE.md`
- Data policy: `docs/DATA_FLYWHEEL_POLICY.md`
- Open-source boundary: `docs/OPEN_SOURCE_POLICY.md`
