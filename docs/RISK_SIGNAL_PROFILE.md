# LedgerGuard Risk Signal Profile v1

Status: public draft and reference self-test. This is not an x402 Foundation
standard, an official protocol requirement, a third-party audit, or a safety
guarantee.

## Purpose

The profile gives wallets, applications, agents, and payment adapters a stable
way to exchange transaction intent, policy decisions, findings, and settlement
evidence without making any payment protocol the core product.

The public interoperability contract consists of:

- `ledgerguard.intent.v1`, `ledgerguard.policy.v1`,
  `ledgerguard.decision.v1`, and `ledgerguard.receipt.v1`;
- CAIP-2 network identifiers and atomic string amounts;
- deterministic canonical SHA-256 digests;
- `ALLOW`, `REVIEW`, and `BLOCK` decisions with machine-readable finding codes;
- fail-closed validation for missing payment recipient, asset, amount, and
  zero-value payments;
- post-settlement receipts that bind to an intent and evidence digest.

## Decision semantics

- `ALLOW`: every required implemented check passed. It is not a guarantee.
- `REVIEW`: evidence, simulation, identity, or policy certainty is incomplete.
- `BLOCK`: a defined policy violation or critical mismatch was found.

AI may explain or propose policy, but it cannot sign, hold keys, override a
deterministic block, or independently authorize payment.

## Versioning

Breaking field or semantic changes require a new schema version and profile
directory. Finding codes are append-only within a profile version. Adapters
must publish the exact profile and evaluator version they implement.

## Protocol adapters

x402, AP2, ACP, A2A, MCP, wallet RPC, and future payment rails map into the
same envelope. A future x402 extension proposal may carry these records, but
LedgerGuard does not claim upstream acceptance until a public Foundation
review and merge are independently verifiable.

## Test material

Machine-readable fixtures live under `conformance/profile-v1`. Run:

```bash
npm run conformance
```

A local pass may be described only as:

> Self-tested against LedgerGuard Risk Signal Profile v1.

It must not be described as certified or officially conformant.
