# Hosted oracle implementation (server-side)

This directory contains **LedgerGuard judgment logic** (preflight rules, evidence
reconciliation, simulation policy).

## Production use

**Call the hosted API** — do not self-host this code for production security decisions.

| Environment | URL |
| --- | --- |
| Public demo | https://ledgerguard-gules.vercel.app |
| Preflight | `POST /v1/preflight` or `POST /v1/can-sign` |
| Evidence | `POST /v1/evidence` |

Integrators should use **`@ledgerguard1/sdk`** (npm), which is a thin HTTP client only.

## Why this code is visible in git

The repository is MIT for transparency and integration trust. Early rules are
deterministic and relatively small. As rules mature, judgment logic may move to a
private deployment while **HTTP contracts stay stable**.

See `docs/OPEN_SOURCE_POLICY.md` for the full open vs hosted-only matrix.

## What not to fork for production

- `preflight.ts` — decision rules and thresholds  
- `evidence.ts` — reconciliation rules  
- Future threat data layers (malicious address lists, phishing feeds)

Forking to bypass metering or to replicate the oracle without attribution is
discouraged; see the policy doc.
