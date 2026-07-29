# LedgerGuard

LedgerGuard is an Arc-first, non-custodial transaction safety service for AI
agents. It checks an intended transaction before signing and produces normalized
evidence after settlement.

Current status: **testnet MVP / mainnet disabled**.

Public demo: **https://ledgerguard-gules.vercel.app**

## What exists

- `GET /` - public, no-wallet browser demo for an Arc USDC transfer preflight.
- `GET /v1/meta` - machine-readable service metadata.
- `POST /v1/preflight` - decode and compare a transaction against an explicit intent and policy.
- `POST /v1/evidence` - reconcile a finalized transaction against the original intent.
- `GET /health` - process health.
- `GET /ready` - read-only Arc Testnet RPC readiness and chain-ID verification.
- `GET /v1/networks` - machine-readable network activation state.
- `GET /v1/paid/network-risk` - Circle Gateway x402 testnet payment demo.
- `GET /openapi.json` - initial API discovery document.
- `GET /.well-known/ledgerguard.json` - agent-readable service and price catalog.
- `GET /llms.txt` - concise discovery instructions for AI agents.

The service does not hold keys, sign transactions, move funds, deploy contracts,
or automatically enable an unknown mainnet.

## Local development

Requirements: Node.js 22.6 or newer.

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

The default RPC list uses Arc's four documented public Testnet endpoints
(Circle, Blockdaemon, dRPC, and QuickNode) in failover order. Override it with
the comma-separated `ARC_TESTNET_RPC_URLS` value if a provider policy changes.

`/v1/*` endpoints have a best-effort, per-instance rate limit controlled by
`RATE_LIMIT_PER_MINUTE` (default `60`). This protects the zero-cost demo from
obvious bursts, but it is not a globally consistent production quota because
serverless instances do not share memory.

The paid endpoint defaults to `0.001 USDC` and stays disabled until
`SELLER_ADDRESS` is configured and `X402_ENABLED=true`. An unpaid request then
returns a standards-shaped `402 Payment Required` response. Never place a
private key or seed phrase in the seller service.

See [`docs/INTEGRATION.md`](docs/INTEGRATION.md) for developer onboarding and
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
