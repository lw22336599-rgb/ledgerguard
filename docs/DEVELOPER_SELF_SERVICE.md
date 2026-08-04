# Developer self-service

LedgerGuard exposes an English, testnet-only developer console at `/developer`.
It creates bounded tenants, displays each API key once, persists only a SHA-256
key hash, meters preflight requests, shows monthly usage, and rotates keys.

## Production configuration

Required:

```text
DEVELOPER_SELF_SERVICE_ENABLED=true
DEVELOPER_MAX_TENANTS=100
DEVELOPER_REGISTRATIONS_PER_DAY=3
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

The equivalent `KV_REST_API_URL` and `KV_REST_API_TOKEN` names are supported.
Never expose these values to browser code, logs, issues, or documentation.

When self-service is enabled, `/ready` fails closed unless the shared store
answers `PING`. The bounded tenant cohort limits free-tier exposure. Monthly
quota enforcement is atomic at the store boundary. Sandbox tenants receive 500
operations per month, expire after 90 days, and retain usage events for 7 days.
Payment fingerprints remain retained for 90 days. Recent per-tenant usage is
capped at 50 events and the payment feed at 1,000 events.

`GET /v1/plans` is the machine-readable plan source of truth. Only Sandbox is
currently available; paid plans remain validation targets until billing and
external demand gates are complete. Registration is limited per day using a
one-way hash of the platform-provided client address; no raw address is stored.

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
timestamps for the tenant plan's retention window (7 days for Sandbox). It
never stores the raw integration value.

Authenticated tenants can read `GET /v1/developer/integration-proof`. The
response summarizes eligible events, active dates, and 14-day repeat activity
using hashed integration identifiers. It always returns
`externallyVerified: false`; only reviewed third-party evidence can change the
public evidence register.

## Tenant governance

Sandbox keys fail closed when the tenant is suspended or its 90-day access
window expires. Operators can inspect or change a known tenant lifecycle with
`npm run tenant:govern -- --tenant <uuid>`. The command is read-only by default;
changing status requires both `--status active|suspended|expired` and `--apply`.
It never prints API keys or credential values.

## External-user evidence gate

The first external user is counted only when a non-project person independently:

1. opens `/developer` or integrates the API;
2. creates a tenant and completes a metered request or x402 test payment;
3. submits the public request ID or testnet transaction through the repository
   beta-result form;
4. confirms whether the delivered result was useful.

Page views, CI probes, operator tests, bots, created tenants without a completed
request, and test coins are not external adoption or revenue.
