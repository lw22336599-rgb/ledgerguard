# Network adapter specification

LedgerGuard uses a **network adapter slot** so new EVM chains can be added without
changing the preflight/evidence API shape. Third-party adapters are welcome; production
listings require review before they appear on `/integrations`.

## Discovery

```http
GET /v1/network-adapters
```

Returns only **enabled** adapters (fail-closed registry). Disabled networks return
`503 NETWORK_DISABLED` on preflight/evidence — never silent fallback.

## Adapter shape (TypeScript)

Defined in `src/adapters/network-adapter.ts`:

```ts
export type NetworkAdapter = {
  name: NetworkName;           // e.g. "arcTestnet", "baseMainnet"
  displayName: string;
  lifecycle: "testnet" | "mainnet" | "shadow";
  enabled: boolean;
  chainId: number;
  usdcAddress: `0x${string}`;
  nativeUsdcGas: boolean;      // true on Arc (18-decimal native USDC view)
  explorerUrl: string | null;
  rpcUrls: readonly string[];
};
```

### Supported `NetworkName` values (registry)

| Name | Typical status | Notes |
| --- | --- | --- |
| `arcTestnet` | Enabled | Primary Guard Link + free API path |
| `arcMainnet` | Disabled until gates | Fail-closed until official parameters + approval |
| `baseMainnet` | Optional API | Requires `BASE_PREFLIGHT_ENABLED=true` on hosted service; no Guard Link UI |

## Adding a network (maintainer path)

1. Add official chain ID, USDC contract, and RPC URLs to `src/config/networks.ts`.
2. Set `enabled`, `officialParametersComplete`, and lifecycle flags truthfully.
3. Extend `networkNameSchema` in `src/schemas.ts`.
4. Add adapter tests under `tests/` (RPC mocks; no secrets in repo).
5. Update `/v1/meta` and smoke tests.
6. Document in this file and `GET /v1/network-adapters`.

**Guard Link UI** stays Arc Testnet until product gates say otherwise. New networks may
be **API-only** (Base pattern).

## Third-party adapter policy (community)

We do **not** accept drive-by PRs that enable mainnet without runbook gates. Community
contributors should:

1. Fork and implement against the public `NetworkAdapter` type.
2. Publish a public repo + tests.
3. Open a GitHub issue: **Independent integration evidence** with:
   - network name and chain ID;
   - USDC address source (official docs);
   - sample `POST /v1/preflight` request IDs;
   - statement of maintenance ownership.

LedgerGuard may list verified community adapters on `/integrations` after review.
Unreviewed adapters are **not** endorsed.

## Fail-closed rules

- Unknown `network` → validation error or `NETWORK_DISABLED`.
- Missing RPC / simulation required but failed → `BLOCK` or `REVIEW`, never silent `ALLOW`.
- `transferFrom` without declared debit address → fail closed.

## SDK usage

```js
import { LedgerGuardClient } from "@ledgerguard1/sdk";

const client = new LedgerGuardClient({
  baseUrl: "https://ledgerguard-gules.vercel.app",
});

const adapters = await fetch(`${client.baseUrl}/v1/network-adapters`).then((r) => r.json());
```

Always read `/v1/network-adapters` at runtime — do not hard-code chain IDs from blog posts.

## Related documents

- `docs/OPEN_SOURCE_POLICY.md` — what stays on the hosted API only
- `docs/INTEGRATION_STACK.md` — where adapters sit in the payment stack
- `docs/GUARD_LINK_FORMAT.md` — human Guard Links (Arc Testnet only today)
