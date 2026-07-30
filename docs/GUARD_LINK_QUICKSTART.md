# Guard Link quickstart

Guard Link turns a declared Arc Testnet USDC payment into a human-readable,
time-bound receipt. It is intended for agents, merchants, and applications that
need a person to review the exact recipient, amount, purpose, and policy limit
before a wallet signs.

## Browser flow

1. Open `https://ledgerguard-gules.vercel.app/guard/create`.
2. Enter only public payment details. Never enter a seed phrase or private key.
3. Share the generated link with the intended payer.
4. The payer reviews the deterministic `ALLOW`, `REVIEW`, or `BLOCK` result.
5. On `ALLOW`, the payer may connect an injected EVM wallet, review the Arc
   Testnet transaction in that wallet, and explicitly approve it.
6. After confirmation, the payer can ask LedgerGuard to reconcile the onchain
   result with the original intent.

The optional requester name is self-declared and is not proof that a company,
domain, or account authorized the request.

## API flow

```bash
curl -X POST https://ledgerguard-gules.vercel.app/v1/guard-links \
  -H "content-type: application/json" \
  -d '{
    "issuer": "Example Agent",
    "recipient": "0x2222222222222222222222222222222222222222",
    "amount": "1.00",
    "limit": "1.00",
    "purpose": "Example invoice",
    "expires": "2030-01-01T00:00:00.000Z"
  }'
```

The response contains a shareable `url` and a deterministic `intentId`. The
server validates and renders the intent but never signs or submits a
transaction.

## Safety boundary

- Arc Testnet only; test assets have no financial value.
- Wallet connection and signing happen client-side after a user action.
- A `BLOCK` result disables wallet handoff.
- A missing or mismatched payer keeps payment disabled.
- `ALLOW` means the implemented deterministic checks passed; it is not a
  guarantee of safety, identity, delivery, or profit.
- Production mainnet charging remains disabled until the documented release
  gates pass.
