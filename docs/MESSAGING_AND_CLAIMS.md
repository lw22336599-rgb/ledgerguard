# Public messaging and claim boundaries

Last reviewed: 2026-08-04

LedgerGuard is a protocol-neutral, non-custodial transaction intent control
layer. It applies deterministic policy before signing and reconciles evidence
after settlement. Network and payment protocols are adapters, not the product's
identity.

## Safe public one-liner

> LedgerGuard helps users, applications, and agents verify who pays whom, how
> much, on which network, and under which policy before signing, then reconcile
> what actually happened after settlement.

## Claim matrix

| Topic | Safe to say | Do not claim yet |
| --- | --- | --- |
| Arc | Arc Testnet preview is live; Arc Mainnet remains disabled. | Arc Mainnet production support or official endorsement. |
| Base | A Base Mainnet x402 endpoint can issue a payment challenge. | Reproducible settlement, revenue, or production billing. |
| x402 | LedgerGuard has x402 adapters and testnet delivery evidence. | That LedgerGuard owns the standard or is Bazaar indexed. |
| Profile | A public LedgerGuard Risk Signal Profile v1 draft and self-test fixtures exist. | That it is an x402 Foundation standard or grants certification. |
| Data | A privacy-safe opt-in telemetry contract exists. | That a proprietary threat graph, trained model, or accuracy advantage has already been proven. |
| Brand | LedgerGuard is the project and hosted-service brand. | `LedgerGuard Conformant`, `Certified`, or third-party endorsement before governance gates pass. |
| Guard Link | A human-readable, time-bounded testnet payment request and review flow exists. | Verified merchant identity, guaranteed safety, or a platform fee. |
| Evidence | Strict reconciliation can return VERIFIED, MISMATCH, or REVIEW. | That every test transaction reconciled successfully. |
| Customers | Public preview and self-service developer surfaces exist. | Paying customers, recurring revenue, or enterprise adoption. |
| Security | Deterministic checks, fail-closed gates, tests, and dependency scanning exist. | A third-party audit, certification, or protection from every loss. |
| Grants | Application material exists. | A verified submission, award, or official partnership. |

## Evidence vocabulary

- `challenge`: a service requested payment; no settlement is implied.
- `authorization`: a payer approved a payment instruction; settlement may still fail.
- `settlement`: a facilitator or chain reports completed value transfer.
- `reconciliation`: LedgerGuard compared the finalized result with the declared intent.
- `revenue`: real funds attributable to an external customer and recorded in business accounts.

Do not collapse these five states into the word "paid".

## Release rule

Any externally visible claim must point to reproducible evidence. Test tokens,
project-party traffic, screenshots, automated tests, and a successful form click
are useful technical evidence but are not customers, revenue, official approval,
or product-market fit.
