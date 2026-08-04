# External validation and attribution

LedgerGuard separates traffic from verified adoption. Page views, bots, CI,
project-owner tests, and testnet payments are not customers or revenue.

## Five-minute attributable integration

1. Create a test key at `https://ledgerguard-gules.vercel.app/developer`.
2. Install the SDK: `npm install @ledgerguard1/sdk`
3. Choose a public, non-secret integration identifier, for example
   `acme-agent-testnet`.
4. Run:

```bash
export LEDGERGUARD_API_KEY=lg_test_...
export LEDGERGUARD_INTEGRATION=acme-agent-testnet
node examples/quickstart.mjs
```

Or use `LedgerGuardClient` / `POST /v1/can-sign` directly — see
`docs/DEVELOPER_INTEGRATION_INVITE.md`.

Every request returns `X-LedgerGuard-Request-Id`. Durable usage events retain
the request ID, timestamp, operation, and only a SHA-256 digest of a valid
`X-LedgerGuard-Integration` value for 90 days. The raw integration identifier is
not stored in the usage ledger. Runtime telemetry records sanitized request
metadata; neither path records source IP addresses or credentials.

## Evidence gate

An integration counts as externally validated only after the tester submits the
`Independent integration evidence` GitHub issue with a public project identity
and reproducible request IDs, public code, or public testnet transaction hashes.
The operator can hash the identifier claimed by the tester and compare it with
the durable digest; a matching digest supports attribution but does not by
itself prove that the tester is independent.
Repeated use requires attributable verified activity on two or more separate
days spanning at least 14 calendar days. A paid pilot requires an explicit
written commitment containing scope, price, decision date, conditions, and
acceptance criteria; selecting a form option is not a commitment. Testnet tokens
never count as revenue.

Current public claims remain zero until that evidence exists:

- externally verified developer integrations: 0;
- verified repeat integrations: 0;
- paid-pilot commitments: 0;
- real revenue: USD 0.

The protected Base Sepolia to Arc Testnet wallet flow and its exact acceptance
evidence are defined in `docs/CROSSCHAIN_ACCEPTANCE.md`. That document does not
lower these external-adoption gates.

## Buyer-validation gate

Buyer qualification, sample privacy boundaries, the 14-day repeat-use rule,
and the paid-commitment test are defined in
`docs/BUYER_VALIDATION_PROTOCOL.md`. Current audited counts are maintained in
`docs/BUYER_EVIDENCE_REGISTER.md`.

## CDP Bazaar testnet gate

`POST /v1/paid/base-sepolia/evidence` is a fail-closed CDP Bazaar candidate. Its
payment is Base Sepolia test USDC, while the delivered resource analyzes an Arc
Testnet transaction. It is not active until all of these are configured:

- `BASE_SEPOLIA_X402_ENABLED=true`;
- encrypted `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET`;
- a valid public `SELLER_ADDRESS`.

Configuration is not indexing proof. The endpoint counts as Bazaar-discoverable
only after one successful CDP testnet settlement and a subsequent successful
search result for that exact resource.
