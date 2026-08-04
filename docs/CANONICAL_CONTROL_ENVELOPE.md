# Canonical control envelope

LedgerGuard keeps intent, policy, decision, and receipt independent of any chain, wallet, agent protocol, or settlement rail.

## Current versions

- `ledgerguard.intent.v1`: compatibility input; its asset field is not normative and does not declare decimals.
- `ledgerguard.intent.v2`: canonical new input using CAIP-2 network, CAIP-19 asset, `amountAtomic`, and explicit `assetDecimals`.
- `ledgerguard.policy.v1`, `ledgerguard.decision.v1`, `ledgerguard.receipt.v1`: stable deterministic policy, result, and evidence contracts.

New adapters must emit Intent v2. Existing Intent v1 fixtures remain valid and migrate only when the caller supplies a verified CAIP-19 asset plus decimals. LedgerGuard never guesses decimals from a ticker such as USDC or USDT.

## Authority boundary

The deterministic core owns ALLOW, REVIEW, and BLOCK. Adapters normalize input and may return findings; AI may explain a result or propose a structured policy. Neither an adapter nor AI can sign, hold keys, override BLOCK, or turn a failed check into ALLOW.

## Compatibility and rollback

Intent v1 is deprecated but not removed. The v1-to-v2 mapper is explicit and tested. If a new adapter cannot supply verified asset identity and decimals, it must remain on the compatibility path or return REVIEW; it must not infer units.
