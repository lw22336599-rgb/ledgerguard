# LedgerGuard integration

Production base URL: `https://ledgerguard-gules.vercel.app`

LedgerGuard is non-custodial. Your application constructs and signs its own
transaction. LedgerGuard receives only an unsigned intent for preflight or a
public transaction hash for evidence.

## Discover the service

```text
GET /.well-known/ledgerguard.json
GET /llms.txt
GET /openapi.json
```

Human-readable onboarding is available at `GET /docs`; `/openapi.json` and the
well-known catalog intentionally return raw JSON for software clients.

## Free transaction preflight

Send the transaction target, calldata, declared intent, and policy to
`POST /v1/preflight`. A response is `ALLOW`, `REVIEW`, or `BLOCK`. Treat
anything other than `ALLOW` as fail-closed.

```js
const decision = await fetch(
  "https://ledgerguard-gules.vercel.app/v1/preflight",
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(unsignedIntent),
  },
).then((response) => response.json());

if (decision.decision !== "ALLOW") throw new Error("Payment blocked");
// Ask the user's wallet to sign only after this point.
```

The complete request schema is in `openapi.json`.

For payer-bound checks, set both the unsigned transaction `from` field and
`intent.expectedDebitAddress`. LedgerGuard blocks `transferFrom` when the
declared debit address is absent or differs from calldata. The evidence endpoint
uses the same field to verify the transfer sender or approval owner, and rejects
extra transfer, approval, or native-value side effects. Zero-value transfers are
blocked; `approve(..., 0)` remains valid for revoking an allowance.

For Arc native USDC, LedgerGuard also checks whether the recipient has deployed
bytecode. A contract recipient remains `REVIEW` because generic call simulation
and receipt logs cannot prove every fallback or internal effect.

## Paid x402 testnet resource

`GET /v1/paid/network-risk` returns HTTP 402 and a `PAYMENT-REQUIRED` header
when no payment signature is supplied. The header contains Circle Gateway
x402 v2 requirements for Arc Testnet (`eip155:5042002`). A compatible buyer
wallet may authorize testnet USDC and retry with `PAYMENT-SIGNATURE`.

The server sends the signed authorization directly to Circle Gateway for
settlement. It does not store or operate the buyer's key.

Use test assets only. The endpoint is a technical and demand-validation demo,
not evidence of revenue or production readiness.

### Reproduce the buyer flow

The repository includes a fail-closed Arc Testnet buyer helper. It generates a
disposable local key in the ignored `.env.x402-buyer.local` file and refuses to
sign unless the challenge matches the expected network, USDC contract, amount,
recipient, and Circle Gateway contract.

```powershell
npm run x402:buyer:init
npm run x402:buyer -- inspect

# Fund the printed address with testnet USDC from the official Circle faucet.
$env:ARC_RPC_URL = "https://rpc.blockdaemon.testnet.arc.io"
npm run x402:buyer -- deposit 0.01
npm run x402:buyer -- status
npm run x402:buyer -- pay
```

The deposit helper only permits `0.01` test USDC. The paid request is fixed at
`0.001` test USDC. A sanitized receipt is written to the ignored
`tmp/x402-payment-evidence.json`; the private key is never included.

The first controlled end-to-end run completed on 2026-07-29. See
`X402_E2E_EVIDENCE.md`.

## Mainnet behavior

Arc Mainnet remains disabled. It will not silently switch when a chain launches.
The release workflow requires official network parameters, two-source
verification, automated conformance tests, shadow traffic, a human approval
fingerprint, and a canary. See `MAINNET_RUNBOOK.md`.
