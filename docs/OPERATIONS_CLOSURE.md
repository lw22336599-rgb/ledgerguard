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
| Tenant/API-key self-service and global quota | GO after durable-store production smoke | `/developer`, one-time keys, rotation, shared usage ledger, fail-closed readiness |
| Enterprise SLA | HOLD | alerting destination, contractual retention policy and load/failure tests |

## Commercial product loop

LedgerGuard uses one deterministic safety core through three product surfaces:

| Surface | User | Current role | Revenue role |
| --- | --- | --- | --- |
| Guard Link | Individual users and testers | Free discovery, understandable preflight results, and feedback | Acquisition and trust; not the primary payer |
| API, SDK, and future MCP server | Wallets, AI agents, and developers | Self-service integration and x402 testnet delivery | Usage-based x402 pricing after real-value mainnet approval |
| Policy Console | Teams and enterprises | Not implemented | Subscription, policy administration, evidence retention, alerts, and SLA |

The current repository completes the free testnet, tenant/API-key, persistent
usage-ledger, and machine-payment demonstration surfaces. It does **not** yet
complete a repeatable real-value revenue loop. The remaining production
capabilities are:

1. self-service plan selection, invoicing or subscription collection, and
   payment-failure handling;
2. a Policy Console for team budgets, allowlists, approvals, evidence history,
   and alerts;
3. customer support, privacy, retention, incident, tax, and commercial terms;
4. one independent integration, accepted delivery, real payment, measured gross
   margin, and repeat-use evidence.

MCP Registry or x402 Bazaar publication can improve discovery, but neither is a
customer, a payment guarantee, nor a substitute for the commercial evidence
above.

## End-to-end testnet loop

1. A person discovers LedgerGuard through the public site, GitHub, or the
   machine-readable catalog.
2. `/test` routes the tester to the browser demo, API examples, or the x402
   buyer runbook.
3. `/developer` lets a tester create a bounded Arc Testnet tenant, receive an
   API key once, run metered preflights, inspect persistent usage, and rotate
   the key without operator assistance.
4. Every API response returns `X-LedgerGuard-Request-Id`; a caller may send a
   non-secret `X-LedgerGuard-Client` label.
5. Preflight and evidence checks fail closed when required chain data or intent
   fields are unavailable.
6. The paid endpoint returns an x402 challenge until a valid testnet payment is
   settled.
7. Successful delivery returns a receipt with payer, amount, settlement
   transaction, network, and explorer link.
8. A durable ledger stores monthly usage events and replay-safe settlement
   fingerprints. API-key hashes are stored; plaintext keys are not.
9. Vercel Web Analytics records aggregate human page traffic. Sanitized runtime
   events correlate API activity by request ID without logging source IPs.
10. Testers submit structured results or bugs through GitHub Issues. Repository
   notifications provide a durable follow-up queue.
11. GitHub Actions runs the production smoke check hourly.
12. The same smoke check verifies that the 5042 Shadow has two-source consensus
    while all real-fund, signing, and mainnet-payment capabilities remain off.

## Evidence and retention

- Arc transactions and settlement receipts are the durable payment evidence.
- GitHub Issues are the durable tester-feedback record.
- GitHub Actions runs are the durable uptime-check record.
- Vercel Web Analytics measures human discovery and page use.
- The managed Redis REST store is the tenant, quota, usage, and replay-safe
  test-payment ledger. It is not evidence of real-value revenue.
- Vercel runtime logs are short-lived diagnostics and are not a billing ledger.
- `OPERATIONS_WEBHOOK_URL` may forward sanitized settlement events to a
  user-controlled HTTPS destination. It is optional and remains unset until an
  authorized destination exists.

Never store a private key, seed phrase, payment signature, API token, or personal
financial information in an issue, log, webhook payload, or project document.

## What remains intentionally external

Provisioning the managed durable store creates a provider terms relationship.
The application therefore keeps developer registration disabled and readiness
fail-closed until an authorized store is attached. Storage health is part of
`/ready` whenever self-service is enabled.

Real adoption cannot be created by code. The commercial gate requires at least:

1. three non-project developers who integrate without operator control;
2. one real agent or application integration and at least 100 attributable
   non-project calls;
3. one repeated use event;
4. one explicit paid-pilot or monthly-subscription answer;
5. one settled real-value payment only after mainnet approval;
6. confirmation that the delivered result was useful;
7. measured delivery cost, positive gross margin, and zero known critical
   security defects.

Until those facts exist, all revenue projections remain scenarios rather than
verified performance.

If 20 qualified projects are contacted without three integrations or one paid
intent, feature expansion stops. The next experiment becomes a narrow ecosystem
adapter, paid audit export, or paid implementation service.

The x402 discovery metadata is implemented, but Bazaar indexing remains
unverified until an independent buyer completes a successful CDP-facilitated
testnet settlement and the resource is found through Bazaar search. Metadata or
a 402 response alone is not proof of listing, usage, or revenue.

## Mainnet rule

Mainnet never switches automatically from a single environment-variable change.
Activation follows `docs/MAINNET_RUNBOOK.md`: official network fingerprint,
two-source verification, conformance tests, read-only shadow traffic, explicit
human approval phrase, canary release, and a tested rollback. The Shadow is
observation-only and cannot activate mainnet. Unknown or conflicting parameters
fail closed.

## Product loop implemented in the production candidate

One deterministic core now has four entry points:

1. a prefilled public Guard Link for ordinary users;
2. the authenticated REST and TypeScript client path for developers;
3. the authenticated, metered MCP endpoint for AI agents;
4. x402 testnet purchases for network-risk and strict evidence receipts.

The developer console supports registration, one-time key delivery, login,
durable quota visibility, preflight, non-enforcing shadow evaluation, and key
rotation. Paid testnet settlements are written to the durable payment ledger
when the configured store is available.

`GET /v1/commercial-candidate` publishes the future Base charging parameters
and independent activation gates. The production settlement adapter is
implemented at `POST /v1/paid/base/evidence` and deployed fail-closed. It cannot
charge until the CDP credentials, seller, bounded price, reviewed fingerprint,
exact action-time approval phrase, and explicit enable flag all pass. A signed
retry is checked for deliverable evidence before the payment middleware can
settle it.

This is a complete technical acquisition-to-delivery loop. It is not yet a
verified commercial loop: the first independent external user, accepted paid
value, attributable gross margin, and repeat behavior remain evidence gates.

## Chain rollout

- Arc Testnet remains the Circle/Arc technical-validation, grant, and official
  collaboration surface.
- Base Mainnet is the first real-value x402 candidate. Its independent adapter
  is deployed but charging remains disabled pending a controlled canary.
- Additional EVM networks must use CAIP-2 identifiers and thin network
  adapters. The policy and evidence engines are not forked or rewritten.
- No chain is activated from rumors, explorer activity, or a single environment
  variable. Official RPC, chain ID, asset contracts, facilitator support,
  conformance, shadow observation, explicit approval, canary, and rollback are
  all mandatory.
