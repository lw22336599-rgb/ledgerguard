# Platform kernel rollback runbook

Batch baseline: `cd06296ba708b1e72fee7e809e87b0273dc435d0`.

## Safety properties

- The extension registry and schema routes are additive; this batch has no database migration.
- Extensions execute only at external HTTPS endpoints. No extension receives a private key or signing authority.
- Arc and Base real-funds paths remain disabled by default and are outside this batch.
- Registry parse failure makes `/ready` return 503. It never silently skips an invalid registry.

## Rollback trigger

Rollback the batch when the production monitor detects invalid registry data, readiness regression, an unexpected mainnet enable state, repeated adapter resource exhaustion, or an API compatibility regression.

## Procedure

1. Preserve request IDs, workflow logs, deployment ID, and the failing manifest as evidence.
2. Disable calls to the affected extension by marking its entry revoked in a corrective commit. Do not delete audit history.
3. If the kernel itself is faulty, redeploy the last known-good baseline from Vercel's immutable deployment history or create a normal Git revert PR for the single batch commit. Never rewrite `main` history.
4. Run `npm run verify:release`, `npm run verify:rollback`, local UI acceptance, and production smoke against the candidate.
5. Confirm `/v1/meta.mainnet` is `disabled`, `/ready` is healthy, and `/v1/extensions/health` is valid before closing the incident.

Rollback is an operational recovery, not evidence that external user data or funds were affected. LedgerGuard remains non-custodial.
