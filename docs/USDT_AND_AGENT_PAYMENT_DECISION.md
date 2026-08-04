# USDT and agent-payment decision

Decision date: 2026-08-04

## Executive decision

USDT belongs in LedgerGuard's asset-neutral architecture, but it is not enabled
on Arc merely because the core can represent arbitrary assets. The current
verified Arc integration remains USDC-first. An experimental USDT adapter will
be added only on a network and token contract supported by primary-source
documentation and a usable settlement route.

LedgerGuard is not yet a complete cross-chain AI-agent payment business. It has
the control-layer building blocks: deterministic intent/policy envelopes,
preflight, evidence, SDK/MCP surfaces, Guard Link, x402 challenges, fail-closed
network gates, and conformance fixtures. It still lacks independently verified
agent integration, a reproducible production settle-deliver-reconcile trace,
signed replay-resistant receipts, and commercial adoption evidence.

## Migration sequence

1. Introduce `AssetDescriptor` (`network`, stable asset ID/address, symbol,
   decimals, transfer method) and generic atomic amount fields.
2. Keep existing micro-USDC fields as a deprecated compatibility facade; do not
   break current SDK users during the migration.
3. Convert preflight and evidence matching to resolve assets through the
   registry. Unknown assets fail closed.
4. Add one experimental USDT adapter with deterministic transfer, approval,
   amount, recipient, and extra-flow fixtures.
5. Prove one canonical agent flow: discover -> quote -> preflight -> user or
   policy authorization -> settle -> deliver -> evidence -> usage record.
6. Ship three project-owned reference integrations: MCP agent, x402 seller, and
   wallet/checkout middleware. Label them as compatibility demonstrations.
7. Recruit three non-project developers. Their independent integrations, one
   repeat use on two separate days, and one written paid-pilot commitment are
   the commercial gate; internal simulations cannot satisfy it.

## Acceptance criteria for an asset adapter

- Primary-source network and token identity recorded.
- Decimals and atomic-unit conversion tested at boundaries.
- Transfer and approval semantics decoded deterministically.
- Unexpected native value, extra transfers, extra approvals, wrong payer,
  wrong recipient, wrong asset, and replay attempts fail closed.
- Seller/facilitator route is explicitly named and verified.
- One complete non-production settlement and evidence trace is reproducible.
- No private key, custody, or model-generated decision enters LedgerGuard.

## Claims boundary

- "Supports asset-neutral control envelopes" is accurate today.
- "Supports USDT payments" is not accurate until an adapter passes the above
  gate.
- "Supports AI-agent integration" may describe SDK/MCP compatibility.
- "Complete autonomous agent-payment business" is not accurate until an
  external integration and paid-value loop are evidenced.
