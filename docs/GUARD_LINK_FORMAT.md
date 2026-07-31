# Guard Link format specification

Guard Links are **shareable payment request URLs** on Arc Testnet. They encode a declared
USDC payment intent so a payer can review amount, recipient, and purpose before connecting
a wallet. Non-custodial — LedgerGuard never holds keys.

## URL template

```
https://{host}/guard?recipient={address}&amount={decimalUsdc}&purpose={text}[&optional…]
```

Production template (from `/v1/meta`):

```
/guard?issuer={urlEncodedName}&recipient={publicAddress}&amount={decimalUsdc}&limit={decimalUsdc}&purpose={urlEncodedPurpose}&expires={isoTimestamp}
```

## Query parameters

| Parameter | Required | Format | Description |
| --- | --- | --- | --- |
| `recipient` | Yes | EVM address | Payee |
| `amount` | Yes | Decimal USDC, ≤6 fractional digits, > 0 | Requested amount |
| `purpose` | Yes | 1–120 chars, no `<` `>` | Human-readable reason |
| `limit` | No | Decimal USDC | Policy cap; defaults to `amount`; must be ≥ `amount` |
| `issuer` | No | 2–80 chars | Self-declared requester name — **not verified identity** |
| `payer` | No | EVM address | When set, enables payer-bound simulation |
| `expires` | No | ISO-8601 with offset | After expiry → `BLOCK` (`GUARD_LINK_EXPIRED`) |

## Create via API

```http
POST /v1/guard-links
Content-Type: application/json

{
  "issuer": "Example Agent",
  "recipient": "0x2222222222222222222222222222222222222222",
  "amount": "1.00",
  "limit": "1.00",
  "purpose": "Example invoice",
  "expires": "2030-01-01T00:00:00.000Z"
}
```

Response:

```json
{
  "url": "https://ledgerguard-gules.vercel.app/guard?…",
  "intentId": "a1b2c3…",
  "network": "arcTestnet",
  "custody": "none",
  "expires": "2030-01-01T00:00:00.000Z"
}
```

## Intent ID

`intentId` = first 20 hex chars of SHA-256 over canonical JSON:

```json
{
  "amount": "…",
  "expires": "…",
  "issuer": "…",
  "limit": "…",
  "payer": "…",
  "purpose": "…",
  "recipient": "0x…"
}
```

Use for support references and evidence correlation — not as a blockchain nonce.

## Payment request page (payer UX)

`GET /guard?…` renders:

1. **Preflight status bar** — `Checks passed` / `Review required` / `Payment blocked`
2. **Payment details** — amount, recipient, purpose, limit, network (Arc Testnet)
3. **Wallet panel** — connect → approve → optional evidence check

Three fields payers should verify before signing:

| Field | Source |
| --- | --- |
| Amount | `amount` (+ wallet shows exact USDC) |
| Recipient | `recipient` |
| Purpose | `purpose` |

## Preflight mapping

Guard Links internally build a `POST /v1/preflight`-equivalent intent:

- `network`: `arcTestnet`
- `to`: official Arc Testnet USDC contract
- `data`: ERC-20 `transfer(recipient, amount)` calldata
- `intent.expectedRecipient`, `expectedAmountMicroUsdc`, `purpose`
- `policy.maxAmountMicroUsdc` from `limit`

See `src/services/guard-link.ts`.

## Safety boundaries (public)

- Arc Testnet only — test assets have no financial value.
- `ALLOW` = implemented checks passed — not “verified merchant.”
- Issuer name is self-declared context, not KYC.
- Expired links are blocked.

## Parsing Guard Links (integrators)

Valid paths: `/guard` (query string required).

```js
const url = new URL(guardLink);
if (url.pathname !== "/guard") throw new Error("Not a Guard Link");
const recipient = url.searchParams.get("recipient");
const amount = url.searchParams.get("amount");
const purpose = url.searchParams.get("purpose");
```

For programmatic preflight, prefer `POST /v1/preflight` or `POST /v1/can-sign` with full
transaction calldata instead of re-implementing Guard Link decoding.

## Related

- Quickstart: `docs/GUARD_LINK_QUICKSTART.md`
- Messaging: `docs/MESSAGING_AND_CLAIMS.md`
- x402 mapping: `docs/PREFLIGHT_RECORD_MAPPING.md`
