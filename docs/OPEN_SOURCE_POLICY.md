# Open-source and hosted-service policy

LedgerGuard uses an open-core model. The repository is licensed under MIT. Code
already released under MIT remains available under those terms; this project
does not claim that published rights can be taken back later.

## Public interoperability layer

The public repository is the reference implementation for:

- control-envelope schemas and deterministic digests;
- REST, OpenAPI, SDK, MCP, and Guard Link contracts;
- protocol and network adapter interfaces;
- deterministic baseline rules and evidence verification;
- conformance tests, examples, and receipt verification tools.

Forks and commercial use are permitted by the existing MIT license. A fork may
not imply that it is the official LedgerGuard hosted service or that LedgerGuard
certified its results.

## Hosted commercial layer

The commercial product may add operational capabilities that are not bundled
into the public reference deployment:

- maintained threat and identity data;
- multi-tenant policy administration and billing;
- durable evidence retention, alerts, analytics, and audit exports;
- managed adapter updates, reliability targets, support, and OEM integration;
- independently reviewed conformance and certification services.

The moat is service quality, maintained data, integrations, evidence, and
distribution. It is not a false claim that deterministic rules already visible
in this MIT repository are closed source.

## Product safety boundary

LedgerGuard is non-custodial. AI may explain findings or propose structured
policy, but it may not sign, hold keys, override a deterministic block, or
independently authorize a payment. Unknown networks and ambiguous evidence fail
closed when the configured policy requires certainty.

## Contribution and certification

Community adapters can be proposed through pull requests. Inclusion in the
reference repository requires tests and review. “LedgerGuard Conformant” or
“LedgerGuard Certified” labels are separate claims and require the criteria in
`GOVERNANCE.md`; self-publishing a plugin does not grant either label.

## Honest claims

Test assets are not revenue. A 402 challenge is not a settled payment. CI is not
product-market fit. Public claims must match `PROJECT_STATUS.md` and
`MESSAGING_AND_CLAIMS.md`.

Last updated: 2026-08-04
