# x402 Payment Preflight Record mapping

LedgerGuard is a **compatible preflight oracle** for stablecoin payment intent safety. We
map our HTTP API outputs to the draft [x402 Payment Preflight Record extension](https://github.com/x402-foundation/x402/pull/2792) (RFC in progress). We do **not** claim authorship of that specification.

## Positioning

| Layer | Owner | LedgerGuard role |
| --- | --- | --- |
| x402 settlement rail | x402 Foundation / facilitators | Compatible — we do not replace facilitators |
| Payment Preflight Record schema | x402 extension (draft PR #2792) | Map our verdicts into `risk` / `payment` blocks where applicable |
| Intent ↔ calldata reconciliation | LedgerGuard | Core product — declared USDC intent vs unsigned transaction |
| Post-settlement evidence | LedgerGuard | `POST /v1/evidence` → `VERIFIED` / `MISMATCH` / `REVIEW` |

Other preflight tools (endpoint readiness, CI gates, generic transaction scanners) solve
adjacent problems. LedgerGuard focuses on **declared stablecoin intent vs unsigned calldata**
and **tx ↔ intent reconciliation** after settlement.

## Decision mapping

| LedgerGuard | x402 draft `risk.verdict` (informal) | Meaning |
| --- | --- | --- |
| `ALLOW` | `GO` (when coverage satisfied) | Implemented checks passed; not a safety guarantee |
| `REVIEW` | `HOLD` / manual path | Missing payer, simulation skipped, or warnings present |
| `BLOCK` | `STOP` | Critical finding or fail-closed policy |

Public copy must never equate `ALLOW` with “safe to sign blindly.” See
`docs/MESSAGING_AND_CLAIMS.md`.

## Field mapping (LedgerGuard → draft record blocks)

### `payment` block

| Draft field | LedgerGuard source |
| --- | --- |
| `network` | `preflight.network` → CAIP-2 via adapter (`arcTestnet`, `baseMainnet`) |
| `asset` | `USDC` (official adapter `usdcAddress`) |
| `payee_address` | `intent.expectedRecipient` or decoded transfer recipient |
| `quote_usd` | `intent.expectedAmountMicroUsdc` / 1e6 |
| `resource` | `intent.purpose` (human context; not a URL unless you pass one) |
| `action_class` | `intent.action` (`transfer`, `approve`, `contract_call`) |

### `risk` block

| Draft field | LedgerGuard source |
| --- | --- |
| `verdict` | Map from `decision` (see table above) |
| `coverage.dimensions[]` | Derived from `findings[]` codes and policy envelope (amount cap, allowed targets) |
| `oracle.name` | `ledgerguard` |
| `oracle.receipt_id` | Response header `X-LedgerGuard-Request-Id` |
| `oracle.binding` | Bind to intent tuple: recipient, asset, network, amount micro-USDC |

LedgerGuard does not yet emit a full JSON Preflight Record document on every response.
Integrators can construct a record from `POST /v1/preflight` or `POST /v1/can-sign` JSON
plus the request ID header for audit trails.

### `authority` block

| Draft field | LedgerGuard source |
| --- | --- |
| `signer_scope` | Optional `from` / `intent.expectedDebitAddress` when payer-bound |
| `policy_basis` | Client-supplied `policy` object (`maxAmountMicroUsdc`, `allowedTargets`, etc.) |

Human confirmation (`authority.human_confirmation`) is out of scope for the stateless
public API today; wallet UIs and Guard Links provide the human review surface.

### `execution` block

| Draft field | LedgerGuard source |
| --- | --- |
| `settlement_status` | `unsigned` at preflight time |
| Post-settlement | `POST /v1/evidence` → `status`, `evidenceHash`, tx hash |

## Example: thin wallet integration

```http
POST /v1/can-sign
Content-Type: application/json
X-LedgerGuard-Integration: acme-wallet-testnet

{
  "network": "arcTestnet",
  "to": "0x3600000000000000000000000000000000000000",
  "data": "0xa9059cbb…",
  "recipient": "0x2222222222222222222222222222222222222222",
  "amountMicroUsdc": "1000000",
  "purpose": "Invoice #42",
  "requireSimulation": true
}
```

Use the JSON body + `X-LedgerGuard-Request-Id` as oracle receipt material when composing
an x402-compatible preflight record for logging or downstream agents.

## Evidence (after settlement)

```http
POST /v1/evidence
```

| LedgerGuard `status` | Use |
| --- | --- |
| `VERIFIED` | On-chain outcome matches declared intent |
| `MISMATCH` | Recipient, amount, asset, or payer mismatch |
| `REVIEW` | Ambiguous or partially verified |
| `REVERTED` | Transaction reverted |

This corresponds to the post-signature reconciliation slot in the integration stack — not
to x402 dispute arbitration (Internet Court class).

## Contributing upstream

When PR #2792 stabilizes, LedgerGuard will publish fixture JSON and optional PR comments
with interop results. Track the draft spec for normative changes — do not fork a private
“LedgerGuard standard” in parallel.

## References

- Draft spec: https://github.com/x402-foundation/x402/pull/2792
- Integration stack: `docs/INTEGRATION_STACK.md`
- Open source boundary: `docs/OPEN_SOURCE_POLICY.md`
- Public messaging: `docs/MESSAGING_AND_CLAIMS.md`
