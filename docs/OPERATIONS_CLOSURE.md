# LedgerGuard operating closure

This document separates a working testnet product from a verified business.
Passing the technical loop does not prove customers, revenue, or an enterprise
service level.

## Current release decision

| Loop | Status | Evidence required |
| --- | --- | --- |
| Public discovery and self-service testing | GO after production smoke | `/`, `/test`, `/docs`, `/catalog`, machine catalog |
| Arc Testnet safety API | GO after production smoke | CI, coverage gate, live chain-ID check, preflight and evidence tests |
| x402 test-payment delivery | GO for valueless test assets | 402 challenge, buyer runbook, settlement receipt and explorer link |
| Arc chain 5042 read-only Shadow | GO after two-source production smoke | full state RPC plus independent chain observer, chain-ID and block convergence, critical-contract bytecode, funds/signing/x402 flags false |
| Tester feedback and follow-up | GO | GitHub Issue Forms, request IDs, repository notifications |
| Mainnet or real-fund use | HOLD | official parameters, independent security review, shadow traffic, explicit human approval and canary |
| Repeatable commercial revenue | UNVERIFIED | one external payer, accepted delivery, gross margin, repeat use or renewal |
| Enterprise SLA and global quota | HOLD | shared durable state, alerting destination, retention policy and load/failure tests |

## End-to-end testnet loop

1. A person discovers LedgerGuard through the public site, GitHub, or the
   machine-readable catalog.
2. `/test` routes the tester to the browser demo, API examples, or the x402
   buyer runbook.
3. Every API response returns `X-LedgerGuard-Request-Id`; a caller may send a
   non-secret `X-LedgerGuard-Client` label.
4. Preflight and evidence checks fail closed when required chain data or intent
   fields are unavailable.
5. The paid endpoint returns an x402 challenge until a valid testnet payment is
   settled.
6. Successful delivery returns a receipt with payer, amount, settlement
   transaction, network, and explorer link.
7. Vercel Web Analytics records aggregate human page traffic. Sanitized runtime
   events correlate API activity by request ID without logging source IPs.
8. Testers submit structured results or bugs through GitHub Issues. Repository
   notifications provide a durable follow-up queue.
9. GitHub Actions runs the production smoke check hourly.
10. The same smoke check verifies that the 5042 Shadow has two-source consensus
    while all real-fund, signing, and mainnet-payment capabilities remain off.

## Evidence and retention

- Arc transactions and settlement receipts are the durable payment evidence.
- GitHub Issues are the durable tester-feedback record.
- GitHub Actions runs are the durable uptime-check record.
- Vercel Web Analytics measures human discovery and page use.
- Vercel runtime logs are short-lived diagnostics and are not a billing ledger.
- `OPERATIONS_WEBHOOK_URL` may forward sanitized settlement events to a
  user-controlled HTTPS destination. It is optional and remains unset until an
  authorized destination exists.

Never store a private key, seed phrase, payment signature, API token, or personal
financial information in an issue, log, webhook payload, or project document.

## What remains intentionally external

The zero-cost testnet deployment uses a bounded in-memory rate limiter. Multiple
serverless instances do not share that state. Production-wide quotas, tenant
usage accounting, replay-safe billing records, and an enterprise SLA require a
shared durable store such as managed Redis or a database. Provisioning one
creates a provider account and terms relationship, so it is a separate,
explicitly authorized production step.

Real adoption cannot be created by code. The commercial gate requires at least:

1. one external tester who completes the flow without operator guidance;
2. one settled real-value payment after mainnet approval;
3. confirmation that the delivered result was useful;
4. measured delivery cost and gross margin;
5. repeat use, renewal, or referral evidence.

Until those facts exist, all revenue projections remain scenarios rather than
verified performance.

## Mainnet rule

Mainnet never switches automatically from a single environment-variable change.
Activation follows `docs/MAINNET_RUNBOOK.md`: official network fingerprint,
two-source verification, conformance tests, read-only shadow traffic, explicit
human approval phrase, canary release, and a tested rollback. The Shadow is
observation-only and cannot activate mainnet. Unknown or conflicting parameters
fail closed.
