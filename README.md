# LedgerGuard

LedgerGuard is an Arc-first, non-custodial transaction safety service for AI
agents. It checks an intended transaction before signing and produces normalized
evidence after settlement.

Current status: **testnet MVP / Base Mainnet adapter deployed fail-closed /
Arc Mainnet unavailable**.

Public demo: **https://ledgerguard-gules.vercel.app**

Public contact: **lw22336599@gmail.com**

GitHub contact: **lw22336599-rgb**

## What exists

- `GET /` - public, no-wallet browser demo for an Arc USDC transfer preflight.
- `GET /docs` - human-readable API guide; raw JSON remains at `/openapi.json`.
- `GET /catalog` - human-readable service and pricing catalog.
- `GET /test` - one public path for browser, API, x402, and feedback testing.
- `GET /developer` - self-service Arc Testnet tenant, API-key, usage, and key-rotation console.
- `GET /status` - live, read-only Arc Testnet readiness page.
- `GET /v1/meta` - machine-readable service metadata.
- `POST /v1/preflight` - decode and compare a transaction against an explicit intent and policy.
- `POST /v1/evidence` - reconcile a finalized transaction against the original intent.
- `GET /health` - process health.
- `GET /ready` - read-only Arc Testnet RPC readiness and chain-ID verification.
- `GET /v1/networks` - machine-readable network activation state.
- `GET /v1/paid/network-risk` - Circle Gateway x402 testnet payment demo.
- `POST /v1/developer/register` - create a bounded testnet tenant and receive its API key once.
- `GET /v1/developer/account` - read the tenant and persistent monthly usage.
- `POST /v1/developer/keys/rotate` - revoke the current key and receive a replacement once.
- `POST /v1/developer/preflight` - authenticated, metered preflight.
- `POST /v1/developer/shadow` - authenticated, metered, non-enforcing evaluation.
- `POST /mcp` - authenticated Streamable HTTP MCP server for read-only tools.
- `POST /v1/paid/evidence` - x402 testnet purchase of a strict evidence receipt.
- `POST /v1/paid/base-sepolia/evidence` - fail-closed CDP Bazaar candidate paid with Base Sepolia test USDC.
- `POST /v1/paid/base/evidence` - fail-closed Base Mainnet x402 canary for strict Arc evidence.
- `GET /v1/bazaar-candidate` - machine-readable CDP activation and indexing-proof gates.
- `GET /v1/commercial-candidate` - fail-closed Base production-candidate gates.
- `GET /guard?...` - prefilled, no-wallet payment intent receipt for people.
- `GET /v1/adapters` - truthful x402/AP2 protocol implementation boundary.
- `GET /openapi.json` - OpenAPI 3.1 machine discovery document.
- `GET /.well-known/ledgerguard.json` - agent-readable service and price catalog.
- `GET /llms.txt` - concise discovery instructions for AI agents.

The service does not hold keys, sign transactions, move funds, deploy contracts,
or automatically enable an unknown mainnet.

Raw JSON under `/openapi.json` and `/.well-known/ledgerguard.json` is intended
for software clients and is not an encoding error. Human visitors should use
`/docs`, `/catalog`, and `/status`.

Human pages load Vercel's privacy-preserving Web Analytics script. API responses
include `X-LedgerGuard-Request-Id`, and server logs contain sanitized request
events without source IP addresses. External testers can submit a structured
beta result or bug report through GitHub Issues; repository notifications then
provide the durable follow-up channel.

`ALLOW` is returned only when every decoded policy check passes and a requested
read-only simulation succeeds. If simulation is intentionally skipped, the
result remains `REVIEW`; if simulation is required but cannot run, it is
`BLOCK`.

For strict payer-bound checks, integrations should provide `from` and
`intent.expectedDebitAddress`. `transferFrom` fails closed without a declared
debit address. Post-settlement evidence verifies the payer/owner and rejects
zero-value payments plus unexpected transfer, approval, or native-value side
effects.

## Local development

Requirements: Node.js 24.x.

```powershell
npm.cmd install
Copy-Item .env.example .env
npm.cmd test
npm.cmd run typecheck
npm.cmd run dev
```

Run the reusable acceptance check against a local or deployed instance:

```powershell
$env:LEDGERGUARD_URL = "https://ledgerguard-gules.vercel.app"
npm.cmd run smoke
```

GitHub Actions runs this check hourly against production. It verifies the web
entry point, Arc Testnet RPC chain ID, a deterministic USDC preflight, the
mainnet safety gate, the read-only 5042 Shadow quorum, and either a valid x402
v2 testnet challenge or a safely disabled paid endpoint.

The built-in fallback uses Arc's primary public Testnet RPC. The example
configuration shows additional public endpoints in failover order; override
the comma-separated `ARC_TESTNET_RPC_URLS` value when provider availability or
policy changes.

`/v1/*`, `/ready`, and `/status` have a best-effort, per-instance rate limit controlled by
`RATE_LIMIT_PER_MINUTE` (default `60`). This protects the zero-cost demo from
obvious bursts. The quota is shared across paths for each source and its
in-memory bucket table is bounded, but it is not a globally consistent
production quota because serverless instances do not share memory.

The paid endpoint defaults to `0.001 USDC` and stays disabled until
`SELLER_ADDRESS` is configured and `X402_ENABLED=true`. An unpaid request then
returns a standards-shaped `402 Payment Required` response. Never place a
private key or seed phrase in the seller service.

Every successful testnet payment returns a receipt containing the payer,
settlement identifier, amount, network, and Arc explorer link. Setting the
optional `OPERATIONS_WEBHOOK_URL` to an HTTPS endpoint sends the same sanitized
event to an operator channel; notification failure never prevents delivery.
The chain receipt is the durable payment evidence. Vercel runtime logs are
operational diagnostics, not a billing ledger.

Set `PUBLIC_BASE_URL` to the canonical HTTPS deployment origin so x402
challenges and discovery metadata cannot be influenced by an incoming Host
header. HTTP is accepted only for localhost development.

Dependabot checks npm and GitHub Actions dependencies weekly. CI verifies types,
tests, the production build, and production dependency vulnerabilities on every
pull request and main-branch push.

See [`docs/INTEGRATION.md`](docs/INTEGRATION.md) for developer onboarding and
[`docs/SDK_MCP_QUICKSTART.md`](docs/SDK_MCP_QUICKSTART.md) for the five-minute
HTTP, SDK, and MCP path,
[`docs/DEVELOPER_SELF_SERVICE.md`](docs/DEVELOPER_SELF_SERVICE.md) for the
tenant/API-key and durable-ledger operating boundary.
[`docs/X402_BUYER_RUNBOOK.md`](docs/X402_BUYER_RUNBOOK.md) for the controlled
test-payment procedure. See
[`docs/EXTERNAL_VALIDATION.md`](docs/EXTERNAL_VALIDATION.md) for attributable
external integration evidence and honest adoption gates. See
[`docs/OPERATIONS_CLOSURE.md`](docs/OPERATIONS_CLOSURE.md) for the end-to-end
operating loop, evidence sources, ownership, and production gates. See
[`docs/OFFICIAL_SUBMISSION.md`](docs/OFFICIAL_SUBMISSION.md) for the
evidence-based ecosystem application pack. This testnet demo has no verified
customer or revenue claim.

## Mainnet activation gates

Arc Mainnet is represented in the network registry but deliberately has no
guessed chain ID, RPC URL, USDC address, or payment facilitator. Activation
requires:

1. official Arc and Circle parameters;
2. two-source configuration verification;
3. automated conformance tests;
4. read-only shadow traffic;
5. a human approval flag;
6. a canary deployment before wider traffic.

The 5042 Shadow is a separate read-only monitor at
`GET /v1/shadow/arc-mainnet`. It compares a full state RPC with an independent
chain observer for chain ID and block-height convergence, while the state RPC
also verifies critical-contract bytecode. It contains no signer,
transaction-submission path, or mainnet x402 middleware.
`ARC_MAINNET_ENABLED`, an exact configuration fingerprint, and the separate
`APPROVE_ARC_MAINNET_CANARY` release phrase are all required before the
production network registry can activate.

Changing one environment variable cannot bypass these checks. See
[`docs/MAINNET_RUNBOOK.md`](docs/MAINNET_RUNBOOK.md) for the fingerprint-based
activation and rollback procedure.

Base Mainnet is a separate payment rail for the protected Arc Testnet evidence
resource. Its adapter is deployed at `POST /v1/paid/base/evidence`, but remains
disabled until six independent gates pass: explicit enablement, the exact
action-time approval phrase, CDP credentials, a valid seller address, a bounded
canary price, and the reviewed configuration fingerprint. This separation does
not imply that Arc Mainnet exists, and it does not let LedgerGuard sign or hold
funds.
