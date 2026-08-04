# Developer self-service

LedgerGuard exposes an English, testnet-only developer console at `/developer`.
It creates bounded tenants, displays each API key once, persists only a SHA-256
key hash, meters preflight requests, shows monthly usage, and rotates keys.

## Production configuration

Required:

```text
DEVELOPER_SELF_SERVICE_ENABLED=true
DEVELOPER_MAX_TENANTS=100
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

The equivalent `KV_REST_API_URL` and `KV_REST_API_TOKEN` names are supported.
Never expose these values to browser code, logs, issues, or documentation.

When self-service is enabled, `/ready` fails closed unless the shared store
answers `PING`. The bounded tenant cohort limits free-tier exposure. Monthly
quota enforcement is atomic at the store boundary. Usage events and payment
fingerprints are retained for 90 days; recent per-tenant usage is capped at 50
events and the payment feed at 1,000 events.

## API-key boundary

- Keys start with `lg_test_` and are valid only for the testnet service.
- The plaintext key is returned only on registration or rotation.
- Browser storage uses `sessionStorage`, so closing the tab removes the local
  copy.
- A rotation revokes the previous key.
- LedgerGuard never asks for a wallet private key or seed phrase.

## Testnet payment delivery

`GET /v1/paid/network-risk` returns an x402 v2 challenge until Circle Gateway
settles a valid Arc Testnet payment. Successful delivery includes the public
settlement transaction. The durable ledger records a fingerprint of that
transaction idempotently and reports `recorded`, `duplicate`, or `unavailable`.
The resource is still delivered after a valid settlement if ledger recording is
temporarily unavailable; the chain receipt remains the payment evidence.

Arc Testnet USDC has no financial value. A completed testnet delivery is a
technical integration result, not revenue.

For attributable trials, send a non-secret `X-LedgerGuard-Integration` value.
The durable usage ledger keeps only its SHA-256 digest alongside request IDs and
timestamps for 90 days. It never stores the raw integration value.

## External-user evidence gate

The first external user is counted only when a non-project person independently:

1. opens `/developer` or integrates the API;
2. creates a tenant and completes a metered request or x402 test payment;
3. submits the public request ID or testnet transaction through the repository
   beta-result form;
4. confirms whether the delivered result was useful.

Page views, CI probes, operator tests, bots, created tenants without a completed
request, and test coins are not external adoption or revenue.
