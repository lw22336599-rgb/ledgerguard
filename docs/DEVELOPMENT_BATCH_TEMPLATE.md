# LedgerGuard development batch template

Copy this template for every material release. No implementation starts until
sections 1-7 are complete. No public push, publish, deployment, or claim starts
until sections 8-10 pass.

## 1. Decision record

- Batch name:
- Owner and date:
- Repository and production baseline revisions:
- Buyer/user, pain, and current substitute:
- Expected user and business outcomes:
- Evidence supporting inclusion:
- Evidence gate that can disprove the hypothesis:

## 2. Scope lock

- In scope:
- Out of scope:
- Existing behavior that must not change:
- Deprecated behavior and removal date:
- External systems/accounts affected:
- Mainnet, signing, custody, funds, identity, legal, spending, or public-action
  boundary:

## 3. Contracts and migrations

- Input/output schema and versioning changes:
- Backward-compatibility mapper:
- State/database migration and rollback:
- API/SDK/MCP/OpenAPI/UI changes:
- Privacy and data-retention impact:

## 4. Threat and failure model

- Assets and trust boundaries:
- Abuse/replay/spoofing cases:
- Provider disagreement, timeout, retry, and idempotency behavior:
- Fail-closed behavior:
- Secret handling and supply-chain provenance:

## 5. Implementation plan

- Work packages and order:
- Files/packages expected to change:
- Reference implementation and third-party proof:
- Observability and alerts:
- Documentation and claim changes:

## 6. Test matrix

- Unit/property, contract/compatibility, negative/security tests:
- Integration and desktop/mobile interaction tests:
- Production shadow/read-only tests:
- Load, quota, timeout, and recovery tests:
- Coverage thresholds:

## 7. Release and rollback plan

- Release branch and local checkpoint strategy:
- Single merge/publish/deploy target:
- Feature flags and default state:
- Rollback trigger and runbook:
- Observation window:

## 8. Pre-release evidence

- [ ] Scope is unchanged or deviations are recorded and re-reviewed.
- [ ] Tests, typecheck, build, conformance, SDK pack, and audit pass.
- [ ] Full local UI interaction audit passes on desktop and mobile.
- [ ] No unresolved P0/P1 or critical/high production vulnerability.
- [ ] Credentials and generated artifacts are clean.
- [ ] Claims match reproducible evidence.
- [ ] Mainnet and real-fund gates remain fail closed unless approved separately.

Evidence links:

## 9. Post-release evidence

- [ ] Production revision matches the approved source revision.
- [ ] Production UI interaction audit passes.
- [ ] Health/readiness/status and enabled-component state agree.
- [ ] Critical success and error journeys pass.
- [ ] Rollback remains available; alerts are explained.

Evidence links:

## 10. Outcome and market gate

- Technical outcome:
- Independent and repeat usage:
- Paid-pilot/subscription evidence:
- Support/maintenance cost:
- Continue / revise / stop decision:
- Next evidence-justified batch:

Tests, self-traffic, test assets, stars, forks, impressions, directory listings,
and grants are not customers or revenue.
