# Wallet and exchange integration (5-minute path)

LedgerGuard is a **hosted preflight oracle** for stablecoin payment intent. Wallets and
exchanges integrate at the **signing boundary** — before the user approves a transaction.

We do not replace Blockaid-class generic scanners or x402 facilitators. We answer:
**“Does this unsigned transaction match what the user/app declared?”**

## When to call us

| Scenario | Endpoint |
| --- | --- |
| User about to sign a USDC transfer | `POST /v1/can-sign` |
| Full policy + custom calldata | `POST /v1/preflight` |
| After tx is mined | `POST /v1/evidence` |

## Minimal wallet flow

```
User confirms payment intent in UI
  → wallet builds unsigned tx (to, data, value)
  → POST /v1/can-sign with recipient, amountMicroUsdc, purpose
  → if decision !== ALLOW: show findings, do not open sign sheet
  → else: wallet prompts sign
  → after mine: POST /v1/evidence (optional audit trail)
```

## Install

```bash
npm install @ledgerguard1/sdk
```

## Example

```js
import { LedgerGuardClient } from "@ledgerguard1/sdk";

const lg = new LedgerGuardClient({
  baseUrl: "https://ledgerguard-gules.vercel.app",
  integration: "acme-wallet-testnet",
});

export async function guardBeforeSign({ network, tx, recipient, amountMicroUsdc, purpose, from }) {
  const decision = await lg.canSign({
    network,
    from,
    to: tx.to,
    data: tx.data,
    valueWei: tx.value?.toString() ?? "0",
    recipient,
    amountMicroUsdc,
    purpose,
    requireSimulation: Boolean(from),
  });

  if (decision.decision === "BLOCK") {
    throw new Error(decision.findings.map((f) => f.message).join("; "));
  }
  if (decision.decision === "REVIEW") {
    // wallet UX: extra confirmation step
  }
  return decision;
}
```

## Headers

| Header | Purpose |
| --- | --- |
| `X-LedgerGuard-Integration` | Public project id for `/integrations` attribution |
| Response `X-LedgerGuard-Request-Id` | Support and evidence tickets |

## Networks

Query `GET /v1/network-adapters` at runtime. Default free-tier path: **`arcTestnet`**.
`baseMainnet` preflight is API-only when enabled on the hosted service.

## x402 agent wallets

For HTTP 402 flows, run LedgerGuard **after** you know the payment calldata and **before**
signing the x402 authorization:

```
optional endpoint readiness (x402station / Ontario / your CI)
  → LedgerGuard can-sign / preflight
  → sign x402 payment
  → facilitator settles
  → LedgerGuard evidence
```

See `examples/x402-seller-hook.mjs` and `docs/PREFLIGHT_RECORD_MAPPING.md`.

## Compliance copy (show in your UI)

- LedgerGuard is an additional check — not a guarantee against all fraud.
- `ALLOW` means implemented deterministic checks passed.
- We are non-custodial; we never receive private keys.
- Sender names on Guard Links are self-declared, not KYC.

## Enterprise / high volume

- Self-service test keys: `/developer`
- Webhooks: `PUT /v1/developer/webhook` (preflight.completed)
- Contact lw22336599@gmail.com for pilot discussions — no paying-customer claim until contracted

## Register public integration

1. Run on testnet with a public integration id.
2. Save `X-LedgerGuard-Request-Id` values.
3. Open **Independent integration evidence** on GitHub.

See `docs/EXTERNAL_VALIDATION.md`.

## Related

- Full partner guide: `docs/PARTNER_INTEGRATION_GUIDE.md`
- Integration stack: `docs/INTEGRATION_STACK.md`
- Open source boundary: `docs/OPEN_SOURCE_POLICY.md`
