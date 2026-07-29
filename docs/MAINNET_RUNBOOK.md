# Arc Mainnet activation runbook

LedgerGuard never guesses an unreleased network configuration and never signs
or submits a transaction. The production switch is configuration-driven, but
it is intentionally not an unattended switch.

## Before activation

1. Confirm Arc is generally available from the official Arc site and Circle
   developer documentation.
2. Record the official chain ID, RPC URL, USDC address, and explorer URL from
   two official sources.
3. Put those four values in a non-production preview environment.
4. Read `GET /v1/networks` and copy the resulting `configFingerprint`.
5. Run typecheck, tests, build, RPC readiness, preflight simulations, and
   evidence reconciliation against preview traffic.
6. Set `ARC_MAINNET_CONFIG_APPROVED_SHA256` to the reviewed fingerprint.
7. Set `ARC_MAINNET_ENABLED=true` only for a canary deployment.
8. Expand traffic only after chain-ID checks and evidence results remain clean.

Changing `ARC_MAINNET_ENABLED` alone cannot activate mainnet. Any later change
to chain ID, RPC, USDC address, or explorer changes the fingerprint and disables
the network until it is reviewed again.

## Rollback

Set `ARC_MAINNET_ENABLED=false` and redeploy. Testnet remains independently
available. Because LedgerGuard is non-custodial, rollback does not require
moving customer funds or rotating wallet keys.

## External dependencies

The minimum reliable production setup is one Serverless deployment, one primary
Arc RPC plus one independent backup RPC, provider-side rate limiting, uptime
monitoring, and an error sink. A single public RPC is acceptable for a demo,
not for a revenue service.
