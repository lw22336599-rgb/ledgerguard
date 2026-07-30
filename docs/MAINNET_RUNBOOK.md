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
7. Set `ARC_MAINNET_RELEASE_APPROVAL=APPROVE_ARC_MAINNET_CANARY` only after the
   action-time human approval for the canary release.
8. Set `ARC_MAINNET_ENABLED=true` only for that canary deployment.
9. Expand traffic only after chain-ID checks and evidence results remain clean.

Changing `ARC_MAINNET_ENABLED` alone cannot activate mainnet. The exact
fingerprint and separate release phrase must also match. Any later change to
chain ID, RPC, USDC address, or explorer changes the fingerprint and disables
the network until it is reviewed again.

## Chain 5042 Shadow

Before general availability, the production candidate may observe chain 5042
through `GET /v1/shadow/arc-mainnet`. Configure:

- `ARC_MAINNET_SHADOW_ENABLED=true`;
- at least one full HTTPS state RPC in `ARC_MAINNET_SHADOW_RPC_URLS`;
- at least one independent HTTPS chain monitor in
  `ARC_MAINNET_SHADOW_OBSERVER_URLS`;
- one healthy source of each type;
- a bounded `ARC_MAINNET_SHADOW_MAX_BLOCK_LAG`.

The status is healthy only when the independent sources agree on chain ID 5042,
block height remains within the configured lag, and the configured state RPC
confirms the USDC and observed GatewayMinter bytecode. Three consecutive
failures open a local 60-second circuit breaker. Only host names and normalized
health facts are publicly returned.

The Shadow cannot sign, submit transactions, hold keys, settle payments, or
enable the `arcMainnet` network. Its response permanently reports
`realFundsEnabled=false`, `signingEnabled=false`, and
`x402MainnetEnabled=false`.

## Rollback

Set `ARC_MAINNET_ENABLED=false` and redeploy. Testnet remains independently
available. Because LedgerGuard is non-custodial, rollback does not require
moving customer funds or rotating wallet keys.

The Shadow can be stopped independently with
`ARC_MAINNET_SHADOW_ENABLED=false`; this does not affect Arc Testnet.

## External dependencies

The minimum reliable production setup is one Serverless deployment, one primary
Arc RPC plus one independent backup RPC, provider-side rate limiting, uptime
monitoring, and an error sink. A single public RPC is acceptable for a demo,
not for a revenue service.
