# Circle Developer Grant application draft

Status: **technically ready for human completion; not submitted**

Official program: <https://www.circle.com/grant>

Submit proposals: <https://circle.questbook.app/> (Circle Developer Grants on Questbook)

Last verified: 2026-07-31

## Application decision

LedgerGuard should apply to the Circle Developer Grants program before buying
production infrastructure or pivoting to another chain.

The current program explicitly prioritizes teams building on Arc and the Circle
Developer Platform, and offers milestone-based USDC funding, technical guidance,
co-marketing, and ecosystem access. LedgerGuard already has an Arc Testnet
deployment, Circle Gateway x402 integration, a public demo, automated tests, live
Base Mainnet x402 at `/canary`, and fail-closed Arc mainnet Guard Link gates.

## Project summary

**Name:** LedgerGuard

**Public demo:** <https://ledgerguard-gules.vercel.app>

**Repository:** <https://github.com/lw22336599-rgb/ledgerguard>

**Category:** Agentic payments / developer tooling / payment safety

**One-line description:** LedgerGuard is a non-custodial Arc transaction
preflight and settlement-evidence service that gives autonomous agents a
machine-verifiable safety checkpoint before signing and an audit record after
settlement.

## Why Arc and Circle are necessary

LedgerGuard is designed around programmable USDC payments and autonomous-agent
transactions:

- Arc Testnet is the active execution and verification network.
- USDC is the product-denominated payment asset.
- Circle Gateway x402 provides the testnet paid-resource flow.
- Deterministic settlement and predictable fees are useful inputs to policy and
  evidence decisions.
- The service complements Circle payment infrastructure rather than custodying
  funds or replacing wallets.

## Verified product evidence

Verified on 2026-07-29:

- Repository working tree was clean before this application draft was added.
- `npm test`: 148 tests passed.
- `@ledgerguard1/sdk@0.1.0` published on npm.
- `npm run typecheck`: passed.
- Public `/health`: HTTP 200.
- Public `/ready`: HTTP 200 and Arc Testnet chain ID `5042002`.
- Public `/v1/meta`: HTTP 200, non-custodial/read-only mode, mainnet disabled,
  x402 Testnet enabled.
- Public `/openapi.json`: HTTP 200.
- Public `/v1/paid/network-risk`: HTTP 402 with price `0.001 USDC` on
  `eip155:5042002`.
- Public production smoke test: PASS for Arc readiness, deterministic preflight,
  Base Mainnet x402 live at `/canary`, and Arc Testnet x402 challenge.

No paying customer, production mainnet volume, or recurring revenue is claimed.

## Current product capabilities

- Compare an unsigned transaction with an explicit intent and policy.
- Return `ALLOW`, `REVIEW`, or `BLOCK`.
- Verify Arc Testnet network state and fail closed on disagreement.
- Normalize post-settlement evidence.
- Expose an x402-paid testnet resource.
- Publish OpenAPI and agent-readable discovery documents.
- Keep Arc mainnet disabled until official parameters and human approval exist.
- Never request or hold private keys.

## Requested Circle support

1. Technical review of the Arc, USDC, and Circle Gateway x402 integration.
2. Introductions to two or more Arc/Circle design partners building agentic
   payments or programmable settlement.
3. Milestone-based infrastructure credits or USDC funding for production-grade
   rate limits, persistent evidence storage, monitoring, and an external
   security review.
4. Eligibility for Circle/Arc ecosystem listing and co-marketing after
   independent integration evidence exists.
5. Mainnet parameter and launch guidance when Arc's official production
   requirements are available.

## Proposed milestones

### Milestone 1: independent testnet integrations

- Two non-affiliated Arc/Circle developer teams complete the preflight and
  evidence flow.
- At least one team completes discovery-to-402-to-response.
- Integration feedback and failures are documented.

### Milestone 2: production controls

- Persistent idempotency and evidence ledger.
- Globally consistent rate limiting and usage accounting.
- Monitoring, alerting, and a seven-day reliability report.
- Security review with all critical findings resolved.

### Milestone 3: Arc mainnet readiness

- Official Arc mainnet parameters verified from two sources.
- Read-only shadow traffic and conformance tests pass.
- A human-approved Arc mainnet release plan and rollback procedure are complete.
- Arc mainnet Guard Links remain disabled until Circle technical review and
  explicit release approval are complete. (Base Mainnet x402 at `/canary` is
  already live as a separate bounded demo.)

## Zero-cash execution policy

LedgerGuard will not buy a server, paid RPC, domain, commercial data source, or
other production tooling before one of these conditions is met:

- Circle/Arc grant funding or infrastructure credits are awarded;
- a design partner prepays for a pilot;
- real usage revenue covers the monthly cost; or
- the owner gives separate, explicit spending approval.

Until then, development stays on the existing local environment, Arc Testnet,
official public test resources, and currently available free deployment limits.

## Evidence gaps before submission

The technical package is ready, but the application is not yet complete:

- Applicant legal name: `[HUMAN REQUIRED]`
- Contact email: `[HUMAN REQUIRED]`
- Country/region confirmation: `[HUMAN REQUIRED]`
- Legal entity status, if any: `[HUMAN REQUIRED]`
- Requested USDC amount: `[HUMAN DECISION AFTER MILESTONE COSTING]`
- Team/founder background: `[HUMAN REQUIRED; DO NOT INVENT]`
- Independent pilot or design-partner evidence: `MISSING`
- Customer, usage, or revenue evidence: `MISSING`

## Immediate work order

1. Keep the current Arc Testnet demo online without purchasing new services.
2. Share `docs/DEVELOPER_INTEGRATION_INVITE.md` and recruit two independent Arc/Circle design partners.
3. Prepare a one-page architecture and threat model for Circle technical review.
4. Submit the application only after the human fields are completed; do not
   invent identity, traction, funding amount, or partnerships.
