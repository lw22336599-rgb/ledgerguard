# LedgerGuard integration stack

LedgerGuard is the **stablecoin intent and evidence layer** for AI agents, wallets, and payment apps. It validates declared USDC payment intent against unsigned calldata **before** signing, and reconciles finalized transactions **after** settlement.

It complements payment rails (x402 facilitators, Guard Links, wallets). It does not replace them and never holds keys.

## Recommended stack

```
CI / static gate (optional)
  -> x402 endpoint readiness (optional)
  -> LedgerGuard preflight or can-sign
  -> wallet signature or x402 settlement
  -> LedgerGuard evidence
```

| Layer | Role | LedgerGuard? |
| --- | --- | --- |
| Code / CI gate | Scan repos for risky payment paths | No |
| x402 readiness | Verify seller URL returns 402 + payment headers | No |
| **Preflight / can-sign** | **Match intent ↔ calldata ↔ policy** | **Yes** |
| Settlement | Move USDC on-chain | No (wallet / facilitator) |
| **Evidence** | **Reconcile tx ↔ intent** | **Yes** |

## Public endpoints (free tier)

| Endpoint | Use when |
| --- | --- |
| `POST /v1/preflight` | Full control over intent + policy objects |
| `POST /v1/can-sign` | Wallet apps: pass recipient, amount, purpose |
| `POST /v1/evidence` | After tx is mined |
| `GET /v1/network-adapters` | Discover enabled networks |

Unsupported networks **fail closed** (`503 NETWORK_DISABLED`).

## npm SDK

```bash
npm install @ledgerguard1/sdk
```

```js
import { LedgerGuardClient, withPreflight } from "@ledgerguard1/sdk";

const client = new LedgerGuardClient({
  baseUrl: "https://ledgerguard-gules.vercel.app",
  integration: "acme-agent-testnet", // optional attribution header
});

const decision = await client.canSign({
  network: "arcTestnet",
  to: "0x3600000000000000000000000000000000000000",
  data: transferCalldata,
  recipient: "0x2222222222222222222222222222222222222222",
  amountMicroUsdc: "1000000",
  purpose: "Invoice #42",
  requireSimulation: false,
});

if (decision.decision !== "ALLOW") {
  throw new Error("Blocked by LedgerGuard");
}
// only now ask the wallet to sign
```

### withPreflight guard

```js
await withPreflight(
  {
    buildInput: () => ({
      network: "arcTestnet",
      to: usdc,
      data: transferCalldata,
      recipient,
      amountMicroUsdc: "1000000",
      purpose: "Guarded transfer",
    }),
    useCanSign: true,
    integration: "my-app-testnet",
  },
  async () => wallet.sendTransaction({ to: usdc, data: transferCalldata }),
);
```

## x402 seller hook pattern

Use `preflightFetch` or `withPreflight` **before** returning paid content:

1. Agent calls your x402-protected URL.
2. Your handler builds the expected USDC transfer calldata.
3. LedgerGuard preflight runs; block or review stops the 200 response.
4. On ALLOW, return content and let the facilitator settle USDC.
5. Call `POST /v1/evidence` with the tx hash for audit trails.

See `examples/x402-seller-hook.mjs`.

## Guard Links (C-track demo)

Guard Links are **Arc Testnet only** payment request pages. They show an honest preflight status bar — not “verified merchant.”

- Create: `POST /v1/guard-links` or `/guard/create`
- Pay: recipient opens `/guard?...` and connects wallet

## Developer webhooks (P1)

Authenticated tenants can register an HTTPS webhook:

```http
PUT /v1/developer/webhook
Authorization: Bearer lg_test_...
Content-Type: application/json

{ "url": "https://example.com/ledgerguard" }
```

LedgerGuard POSTs `preflight.completed` events with `X-LedgerGuard-Request-Id`. Evidence webhooks are planned for a future release.

Outbound delivery is fail-closed. The operator must add the exact hostname to
`DEVELOPER_WEBHOOK_ALLOWED_HOSTS`; an empty allowlist disables registration and
delivery. This prevents tenant-controlled URLs from becoming an unrestricted
server-side request primitive.

## Base USDC (Plan B, API only)

When `BASE_PREFLIGHT_ENABLED=true`, `baseMainnet` appears in `/v1/network-adapters`. Guard Link UI stays Arc-only.

## Attribution and external validation

Send `X-LedgerGuard-Integration: your-project-id` on API calls. Register public evidence via the GitHub issue template listed on `/integrations`.

Current verified external integrations: **0**. Testnet usage is free and has no financial value.

## What LedgerGuard is not

- Not a wallet, escrow, or x402 facilitator
- Not ML anti-fraud (Blockaid / GoPlus class)
- Not a “verified merchant” badge for Guard Links
- Not the author of the x402 Payment Preflight Record specification (compatible mapping only)

## Specification documents

| Document | Purpose |
| --- | --- |
| [`PREFLIGHT_RECORD_MAPPING.md`](PREFLIGHT_RECORD_MAPPING.md) | Draft x402 PR #2792 field mapping |
| [`NETWORK_ADAPTER_SPEC.md`](NETWORK_ADAPTER_SPEC.md) | Network adapter slot |
| [`GUARD_LINK_FORMAT.md`](GUARD_LINK_FORMAT.md) | Guard Link URLs |
| [`OPEN_SOURCE_POLICY.md`](OPEN_SOURCE_POLICY.md) | Open vs hosted-only |
| [`WALLET_EXCHANGE_INTEGRATION.md`](WALLET_EXCHANGE_INTEGRATION.md) | Wallet/exchange path |

See also: `docs/MESSAGING_AND_CLAIMS.md`, `docs/EXTERNAL_VALIDATION.md`.
