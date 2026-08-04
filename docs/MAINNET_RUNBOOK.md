# Production network activation runbook

Arc Mainnet and Base Mainnet serve different roles. Arc remains the network
being analyzed and cannot be activated until Circle publishes official
production parameters. Base Mainnet is an already supported x402 payment rail
for purchasing an Arc Testnet evidence receipt.

## Base Mainnet x402 canary

The deployed route is `POST /v1/paid/base/evidence`. It uses CAIP-2 network
`eip155:8453`, Base USDC
`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`, and the authenticated CDP
facilitator. It is fail-closed by default.

Before a one-request real-funds canary:

1. Configure encrypted `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET` in the hosting
   provider; never commit them.
2. Confirm `SELLER_ADDRESS` and set a bounded
   `BASE_MAINNET_PRICE_MICRO_USDC` between 1 and 100000.
3. Leave `BASE_MAINNET_X402_ENABLED=false`, deploy, and read
   `GET /v1/commercial-candidate`.
4. Independently review the network, USDC asset, facilitator, seller, price,
   route, and adapter version, then copy `configFingerprint` to
   `BASE_MAINNET_CONFIG_APPROVED_SHA256`.
5. Obtain action-time approval for a real-funds canary and only then set
   `BASE_MAINNET_RELEASE_APPROVAL=APPROVE_BASE_MAINNET_CANARY`,
   `BASE_MAINNET_PUBLIC_CANARY_ENABLED=true`, and
   `BASE_MAINNET_X402_ENABLED=true`.
6. Execute one bounded buyer request, confirm delivery plus the facilitator
   settlement receipt, and immediately review logs and the recipient balance.
7. Disable the route again if the receipt, amount, recipient, attribution, or
   delivered evidence differs from the reviewed intent.

Changing only the enable flag cannot activate charging. Any change to the
recipient, price, route, asset, network, facilitator, or adapter version changes
the fingerprint and fails closed.

Rollback is `BASE_MAINNET_X402_ENABLED=false` followed by redeployment. Because
the service is non-custodial, rollback does not require moving user funds.

## Arc Mainnet activation

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
