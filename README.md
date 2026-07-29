# LedgerGuard

LedgerGuard is an Arc-first, non-custodial transaction safety service for AI
agents. It checks an intended transaction before signing and produces normalized
evidence after settlement.

Current status: **testnet MVP / mainnet disabled**.

Public demo: **https://ledgerguard-gules.vercel.app**

Public contact: **lw22336599@gmail.com**

GitHub contact: **lw22336599-rgb**

## What exists

- `GET /` - public, no-wallet browser demo for an Arc USDC transfer preflight.
- `GET /docs` - human-readable API guide; raw JSON remains at `/openapi.json`.
- `GET /catalog` - human-readable service and pricing catalog.
- `GET /test` - one public path for browser, API, x402, and feedback testing.
- `GET /status` - live, read-only Arc Testnet readiness page.
- `GET /v1/meta` - machine-readable service metadata.
- `POST /v1/preflight` - decode and compare a transaction against an explicit intent and policy.
- `POST /v1/evidence` - reconcile a finalized transaction against the original intent.
- `GET /health` - process health.
- `GET /ready` - read-only Arc Testnet RPC readiness and chain-ID verification.
- `GET /v1/networks` - machine-readable network activation state.
- `GET /v1/paid/network-risk` - Circle Gateway x402 testnet payment demo.
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
mainnet safety gate, and either a valid x402 v2 challenge or a safely disabled
paid endpoint.

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
[`docs/X402_BUYER_RUNBOOK.md`](docs/X402_BUYER_RUNBOOK.md) for the controlled
test-payment procedure. See
[`docs/OPERATIONS_CLOSURE.md`](docs/OPERATIONS_CLOSURE.md) for the end-to-end
operating loop, evidence sources, ownership, and production gates. See
[`docs/OFFICIAL_SUBMISSION.md`](docs/OFFICIAL_SUBMISSION.md) for the
evidence-based ecosystem application pack. This testnet demo has no verified
customer or revenue claim.

## Mainnet activation gate

Mainnet is represented in the network registry but deliberately has no guessed
chain ID, RPC URL, USDC address, or payment facilitator. Activation requires:

1. official Arc and Circle parameters;
2. two-source configuration verification;
3. automated conformance tests;
4. read-only shadow traffic;
5. a human approval flag;
6. a canary deployment before wider traffic.

Changing one environment variable cannot bypass these checks. See
[`docs/MAINNET_RUNBOOK.md`](docs/MAINNET_RUNBOOK.md) for the fingerprint-based
activation and rollback procedure.
