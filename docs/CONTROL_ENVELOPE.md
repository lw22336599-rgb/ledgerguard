# Canonical transaction-control envelope

LedgerGuard adapters normalize protocol-specific requests into four small,
versioned records:

1. `ledgerguard.intent.v1` — who wants to do what, where, for how much, and why;
2. `ledgerguard.policy.v1` — deterministic constraints;
3. `ledgerguard.decision.v1` — ALLOW / REVIEW / BLOCK plus findings;
4. `ledgerguard.receipt.v1` — observed settlement outcome and evidence hash.

The executable Zod schemas and canonical SHA-256 digest helper are in
`src/domain/control-envelope.ts`.

```json
{
  "schemaVersion": "ledgerguard.intent.v1",
  "id": "intent_checkout_42",
  "createdAt": "2026-08-04T00:00:00.000Z",
  "actor": { "kind": "agent", "id": "merchant-checkout" },
  "operation": {
    "kind": "payment",
    "network": "eip155:8453",
    "to": "0x2222222222222222222222222222222222222222",
    "asset": "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "amountAtomic": "1000000",
    "purpose": "Invoice 42"
  },
  "source": { "protocol": "x402", "reference": "checkout-42" }
}
```

The optional `source` records provenance; it does not make the core depend on
any adapter. Adapter support must be reported separately through the maturity
tiers in `GOVERNANCE.md`.
