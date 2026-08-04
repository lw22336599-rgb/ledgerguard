# Batch: protocol-neutral platform kernel

Status: RELEASE CANDIDATE — LOCAL GATES PASSED
Owner: LedgerGuard project stewardship
Started: 2026-08-05
Baseline source revision: `cd06296ba708b1e72fee7e809e87b0273dc435d0` on `main`
Production baseline: `/health` and `/ready` HTTP 200; Arc Testnet chain ID
`5042002`; developer self-service ready; mainnet disabled

## Decision record

- Buyer/user: wallet, agent, payment application, and independent adapter
  developer teams that need deterministic pre-sign control and evidence without
  custody.
- Pain: protocol-specific integration code is difficult to reuse and unsafe
  extensions can blur claims, permissions, and lifecycle responsibility.
- Current substitute: each team builds its own validation glue, relies on a
  generic scanner, or skips intent-bound reconciliation.
- User outcome: implement one isolated adapter without modifying the control
  core, validate it locally, and inspect its maturity and lifecycle over API.
- Business outcome: make official hosted policy/evidence, managed adapters,
  enterprise controls, and OEM support possible without closing public
  interoperability contracts.
- Disproof gate: if two observed external developers cannot integrate after two
  attempts, platform expansion stops until the developer experience is fixed.

## Scope lock

In scope:

- versioned Extension Manifest v1 and JSON schema;
- remote HTTP adapter contract with HTTPS/localhost safety boundary;
- deterministic conformance runner and reference fixtures;
- immutable registry metadata, maturity, expiry, and revocation;
- public registry and health API, OpenAPI and documentation;
- readiness integration for invalid official registry state;
- automated monitor and rollback/release evidence runbook;
- backward-compatible canonical envelope improvements.

Out of scope: new chain deployment, real-fund activation, custody/signing,
arbitrary plug-in execution, marketplace settlement, certification, token,
proprietary data, enterprise control plane, and unrelated UI redesign.

Existing behavior that must not change: Arc Testnet preflight/evidence, Guard
Link, tenant/API-key controls, x402 testnet boundary, fail-closed mainnet, MCP,
and all public error behavior.

Pre-existing uncommitted work at batch start: homepage messaging changes in
`src/ui.ts` and generated browser bundles. These are preserved, audited, and
must pass the same release gates; they are not overwritten.

## Contracts and migrations

- No database migration.
- Manifest schema: `ledgerguard.extension.v1`.
- Registry records are source-controlled metadata; no executable code is
  loaded from registry entries.
- Current legacy API request fields remain supported. The canonical envelope
  remains additive and protocol neutral.
- Rollback removes the new registry routes and artifacts without altering
  tenant, payment, or evidence state.

## Threat and failure model

- Reject malformed identifiers, unpinned source revisions, missing digests,
  unknown capabilities, ambiguous permissions, expired records, and invalid
  lifecycle transitions.
- Remote adapters are HTTPS-only except loopback development URLs, have bounded
  request/response sizes and timeouts, and never receive secrets implicitly.
- Registry or adapter failure cannot convert REVIEW/BLOCK into ALLOW.
- Revoked/expired adapters cannot be reported ready.
- No dynamic import or installation of third-party packages in production.

## Test matrix

- Manifest positive/negative/property boundaries.
- Registry duplicate, expiry, revocation, and maturity behavior.
- Remote adapter URL, timeout, response schema, and fail-closed behavior.
- Public API/OpenAPI/readiness behavior.
- Full existing tests, coverage, build, SDK pack, dependency audit.
- Full local and production desktop/mobile interaction audits.

## Release and rollback

- Develop in the current workspace with recoverable local checkpoints.
- Local checkpoint commits are allowed; one reviewed public push and one production deployment occur only after all gates pass.
- Mainnet and real funds remain disabled.
- Roll back to `cd06296` plus the already-reviewed UI correction if any P0/P1,
  readiness regression, registry integrity failure, or interaction failure is
  observed.
- Post-deploy observation: production smoke and interaction audit immediately,
  then scheduled uptime monitoring.

## Evidence checklist

- [x] Contracts and implementation complete
- [x] Independent reference adapter passes conformance
- [x] Typecheck/tests/coverage/build/package/audit pass
- [x] Local UI interaction audit passes (78 checks, zero issues)
- [x] Rollback verification passes
- [ ] Single public push/deploy complete
- [ ] Production smoke and UI audit pass
- [ ] Project status and durable memory updated

Technical completion does not count as independent adoption, customer demand,
or revenue.
