# LedgerGuard batch development master plan

Status: **PLAN LOCK CANDIDATE**
Applies to: the next platform-refactor release only
Product state after this batch: public preview; real-fund mainnet remains disabled

## Objective

Complete the stable platform skeleton in one controlled development batch so
future chain, asset, wallet, and protocol work is delivered as isolated
adapters instead of repeated core rewrites.

This plan does not promise a permanently finished or maintenance-free product.
It minimizes maintenance by freezing stable contracts, isolating volatile
integrations, automating routine checks, and escalating only actionable
incidents.

## Release model

```text
plan lock
  -> contract and migration tests
  -> implementation on one release branch
  -> local full-system acceptance
  -> independent review and production shadow verification
  -> one reviewed merge/release/deployment
  -> post-deploy acceptance and observation window
```

Developers may make small local commits as recoverable checkpoints. They must
not repeatedly push, publish, or deploy incomplete slices. Public delivery is
one reviewed release after every mandatory gate passes.

## In-scope deliverables

### 1. Canonical protocol-neutral contracts

- Version the intent-policy-decision-receipt envelope.
- Use CAIP-2 network identifiers and CAIP-19 asset identifiers where applicable.
- Represent value as `amountAtomic` plus explicit decimals; never infer units
  from a ticker.
- Keep existing Arc/USDC request fields behind a documented deprecated
  compatibility mapper.
- Separate network, asset, protocol, wallet, identity, policy, and evidence
  capabilities.

### 2. Extension Manifest v1

Define and validate extension identity, author, version, license, source,
maintainer, capability, supported identifiers, schemas, permissions, data
boundaries, fixtures, source commit, artifact digest, provenance, failure
behavior, expiry, revocation, limitations, and optional author-owned pricing.

### 3. Adapter kit and isolation boundary

- Publish TypeScript interfaces, validators, fixtures, and a reference adapter in the public repository. A separate npm release is optional and requires its own release gate.
- Community adapters run on the author's infrastructure and are called through
  a versioned HTTP contract during the first stage.
- Never dynamically execute an unreviewed npm package inside the LedgerGuard
  production process.
- Official bundled adapters require source review, pinned dependencies,
  provenance, conformance, monitoring, and a named maintainer.

### 4. Conformance runner and registry kernel

- Provide a CLI that validates manifests, schemas, deterministic behavior,
  timeout/failure behavior, prohibited data access, and reconciliation.
- Produce a machine-readable report tied to a commit and artifact digest.
- Store reviewed metadata, immutable versions, maturity state, expiry,
  revocation, and security notices without hosting arbitrary code.
- Distinguish Community, Self-tested, Conformant, and Production-candidate.
  Do not introduce paid certification in this batch.

### 5. Product, operations, and commercial alignment

- Make website, API, SDK, MCP, OpenAPI, and examples use the same vocabulary.
- Preserve Guard Link as the plain-language user surface.
- Preserve deterministic ALLOW / REVIEW / BLOCK authority; AI may explain or
  propose structured policy only.
- Retain fail-closed mainnet gates.
- Monitor service health and adapter/registry freshness in this batch. Existing request telemetry, quota ledgers, and receipt reconciliation remain their own operator evidence sources; no alert may claim those signals are monitored until its query and threshold are implemented.
- Keep schemas, SDKs, adapter kit, fixtures, and reference adapters public.
- Keep enterprise controls, proprietary threat data, customer policies,
  hosted retention, billing, SLA, and OEM operations outside the MIT repository.

## Explicitly out of scope

- implementing every chain or asset;
- public real-fund mainnet activation;
- custody, signing, a bridge, or a wallet;
- arbitrary in-process plug-ins;
- a full marketplace or unified third-party settlement system;
- token issuance;
- paid certification without independent governance and legal review;
- redesigns unrelated to the acceptance path.

## Work packages and order

1. **Baseline freeze:** record repository revision, API/schema inventory,
   production routes, current coverage, and known issues.
2. **Contracts first:** write schemas, compatibility rules, deprecation plan,
   migration, rollback, and negative fixtures before implementation.
3. **Core migration:** introduce canonical types and mapping layers without
   breaking current clients.
4. **Extension kernel:** implement manifest validator, adapter kit,
   conformance runner, registry records, expiry, and revocation.
5. **Reference proof:** create an independent mock adapter and prove it
   integrates without changing the policy or evidence core.
6. **Surface alignment:** update API, SDK, MCP, OpenAPI, Guard Link, docs, and
   status reporting.
7. **Operations:** add monitoring, dependency/security checks, backups where
   state is durable, and a rollback rehearsal.
8. **Full acceptance:** resolve all P0/P1 issues and produce an evidence bundle.
9. **Single release:** merge, publish, deploy, re-run production acceptance,
   and observe before declaring the batch complete.

## Mandatory acceptance gates

### Contract and extension gates

- Existing supported SDK/API examples pass unchanged or through a tested
  deprecated mapper.
- Invalid or ambiguous network, asset, decimals, amount, capability, and
  manifest data fails closed with a visible reason.
- Schema versioning and migration/rollback behavior are documented and tested.
- A third-party-style adapter integrates without editing the core.
- Manifest, timeout, retry, replay, expiry, and revocation tests pass.
- Registry status cannot imply official safety without required evidence.

### Product gates

- All tests, typecheck, build, SDK pack-install, conformance, dependency audit,
  and release verification pass.
- Critical deterministic core/schema changes reach at least 95% statement and
  90% branch coverage. The security-critical remote-adapter execution boundary
  reaches at least 90% statement and 85% branch coverage; generated registry
  data and declarative package contracts remain covered by the repository-wide
  threshold plus explicit conformance and pack-install gates.
- Every public route and interaction passes desktop/mobile acceptance in
  `RELEASE_ACCEPTANCE.md`, including error feedback and status consistency.
- No unresolved critical/high production vulnerability or P0/P1 defect exists.
- Mainnet and real-fund paths remain disabled and fail closed.

### Operating gates

- Health/readiness, adapter freshness, error-rate, quota, and receipt mismatch
  alerts are actionable and deduplicated.
- Rollback is rehearsed outside production.
- Release artifacts are tied to source revision, provenance, and digest.
- The repository is clean and contains no temporary credentials.

## Stop and rollback rules

- If compatibility cannot be preserved, keep the old contract active and ship
  the new contract as an opt-in version.
- If extension isolation requires arbitrary code execution, use remote HTTP
  adapters only.
- If two external developers cannot complete the adapter flow after two
  observed attempts, stop marketplace work and repair the developer experience.
- If 20 qualified conversations do not yield three integrations and one paid
  signal, stop generic expansion and revisit buyer and wedge.
- Any critical security issue, fund-flow mismatch, or failed rollback blocks
  release.

## Low-maintenance operating model

Routine automation performs read-only smoke tests, dependency and secret scans,
adapter expiry checks, reconciliation sampling, quota/usage rollups, backups,
and provenance checks. Humans are notified only for actionable failure,
security event, external response, approval gate, or commercial signal.

The owner is not required for routine development or monitoring. Action-time
approval remains mandatory for identity/legal declarations, public account
actions, spending, contracts, wallet signatures, real funds, and mainnet.

## Definition of done

The batch is complete only when the acceptance evidence bundle is linked from
`PROJECT_STATUS.md`, production verification passes, rollback is available,
and no gate is represented by a promise. Technical completion does not prove
market adoption or revenue.
