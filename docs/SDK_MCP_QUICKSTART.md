# SDK and MCP quickstart

LedgerGuard remains non-custodial: it accepts unsigned transaction data or a
public transaction hash. It never receives a wallet key and never signs.

## Five-minute HTTP integration

1. Open `https://ledgerguard-gules.vercel.app/developer`.
2. Create a free Arc Testnet API key and save it once.
3. Run:

```powershell
$env:LEDGERGUARD_API_KEY = "lg_test_..."
node examples/quickstart.mjs
```

The example calls `POST /v1/developer/shadow`. Shadow results are metered but
never authorize, sign, or submit a transaction. Move to
`POST /v1/developer/preflight` only after reviewing the policy response.

## TypeScript client

The repository exports `LedgerGuardClient` from `src/sdk/index.ts`. It supports
free or authenticated preflight, authenticated shadow, and evidence retrieval.
HTTP errors are structured and never include the API key.

## MCP

The Streamable HTTP MCP endpoint is:

```text
POST https://ledgerguard-gules.vercel.app/mcp
Authorization: Bearer lg_test_...
```

It exposes three read-only tools:

- `ledgerguard_preflight`
- `ledgerguard_shadow`
- `ledgerguard_evidence`

Each call consumes one test quota unit. All tools are marked read-only,
non-destructive, and idempotent. They cannot sign or send a transaction.

## Paid evidence

`POST /v1/paid/evidence` first verifies that the requested Arc Testnet
transaction exists, then returns an x402 testnet challenge. After successful
test-asset settlement it delivers a strict evidence receipt. Missing
transactions are rejected before settlement so they are not charged.

## Production candidate

`GET /v1/commercial-candidate` publishes the reviewed Base mainnet candidate
parameters and independent activation gates. Real funds remain fail-closed.
Configuration alone cannot enable charging until the production settlement
adapter has passed its own controlled test.
