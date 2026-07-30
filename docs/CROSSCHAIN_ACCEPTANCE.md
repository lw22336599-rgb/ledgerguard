# Protected crosschain acceptance

LedgerGuard Routes is a non-custodial browser flow for a deliberately bounded
test route: Base Sepolia USDC to Arc Testnet USDC through Circle App Kit and
CCTP. The product never receives a seed phrase or private key. Every approval,
burn, and transfer remains under the user's wallet.

## Engineering acceptance

The engineering gate passes only when all of the following are true:

- `GET /routes` renders the wallet, quote, execution, and evidence workflow.
- EIP-6963 or an injected EIP-1193 provider connects only after a user click.
- The amount cannot exceed `0.001 USDC`.
- A quote is completed before execution and changing the amount invalidates it.
- Execution requires a separate browser confirmation and wallet signatures.
- App Kit routes only from `Base_Sepolia` to `Arc_Testnet`, with batching
  disabled and CCTP standard transfer selected.
- The custom test fee cannot exceed `0.000001 USDC` and is disabled when no
  validated public fee recipient is configured.
- `POST /v1/cctp/evidence` returns `VERIFIED` only after Circle's decoded
  message matches domain 26, recipient, and amount; attestation is complete;
  the Arc transaction succeeded; and its USDC mint log exactly matches the
  declared recipient and amount.
- Missing evidence returns `PENDING`; a conflicting intent or completed mint
  with wrong delivery returns `MISMATCH`.
- Tests, typecheck, build, dependency audit, and production smoke checks have
  recorded results.

## Human wallet acceptance

This check cannot be completed by CI or the service operator on behalf of a
wallet owner.

1. Open `/routes` in a browser containing a funded Base Sepolia test wallet.
2. Connect explicitly and confirm the displayed public address.
3. Enter at most `0.001 USDC` and an Arc Testnet recipient.
4. Request a quote and review route, amount, fee, and gas availability.
5. Continue to wallet review and independently approve each wallet prompt.
6. Preserve the source transaction hash, destination transaction hash, and
   final `/v1/cctp/evidence` response.
7. Accept only `VERIFIED`; `PENDING`, `MISMATCH`, rejected signatures, or
   unavailable RPCs are not successful completion.

Testnet tokens and custom test fees are not revenue.

## Commercial validation ledger

Never infer these outcomes from page views, owner testing, social posts, or
testnet transfers:

| Gate | Required evidence | Current claim |
| --- | --- | --- |
| Two design partners | Two independent project identities, public or consented integration evidence, and reproducible request or transaction IDs | Not achieved |
| Seven-day repeat user | The same external tenant or wallet completes an attributable protected call on seven consecutive UTC dates | Not achieved |
| Paid pilot | Written scope, price, payer identity, real settlement evidence, delivery, and buyer acceptance | Not achieved |

## Base Mainnet revenue canary

Base Mainnet charging remains fail-closed. It may be enabled for one bounded
request only after:

- the existing `docs/MAINNET_RUNBOOK.md` fingerprint and dual-enable gates pass;
- the buyer and seller approve the exact resource, amount, recipient, and
  refund/incident contact;
- an independent security review accepts the dependency tree and deployed
  commit;
- an explicit action-time authorization covers the real-funds transaction;
- daily tenant and revenue caps, alerting, and the kill switch are verified;
- the settlement receipt and delivered resource are reconciled before the
  route is expanded.

Arc production activation remains separate and disabled until official public
mainnet parameters and production support are available.
