# Governance and contribution model

## Decision rights

- The maintainer controls the LedgerGuard name, hosted service, release keys,
  certification marks, and production configuration.
- Contributors retain the rights provided by the repository license and may
  fork it, but cannot represent a fork as the official hosted service.
- Wallet signing, real-fund transfers, public account changes, contracts,
  spending, and legal commitments always require an authorized human at action
  time.

## Adapter maturity

| Tier | Meaning |
| --- | --- |
| Interface | Schema or mapping only; no support claim |
| Experimental | Tests exist; testnet or fixture evidence only |
| Conformant | Required conformance suite passes on a pinned version |
| Production candidate | Bounded canary, rollback, monitoring, and ownership verified |
| Production | Repeated settlement and reconciliation evidence plus an operator runbook |

No adapter may skip tiers through marketing language.

## Contribution path

1. Open an issue describing the user outcome and safety boundary.
2. Add or update tests before implementation.
3. Keep protocol-specific logic in a thin adapter.
4. Run typecheck, tests, coverage, build, dependency audit, and diff checks.
5. Obtain review before merge. Security-sensitive changes require explicit
   maintainer approval.

The project may later fund accepted work through cash bounties, paid integration
services, or a single-level attributed referral program. There is no promise of
tokens, equity, permanent revenue share, or multi-level commissions.

## Certification

`Community` means published by its author. The current public suite supports
only `Self-tested against LedgerGuard Risk Signal Profile v1` for a pinned
commit. `LedgerGuard Conformant` and `LedgerGuard Certified` are reserved until
the legal, independent-runner, issuance, expiry, appeal, revocation, and
conflict-of-interest gates in `CONFORMANCE.md` are complete. A test pass alone
does not grant a brand mark.

## Release truth

`PROJECT_STATUS.md` is the public claim register. CI artifacts and test fixtures
must identify whether they prove a local run, a testnet flow, a facilitator
response, an on-chain receipt, or an external user outcome. One class of
evidence must never be presented as another.
