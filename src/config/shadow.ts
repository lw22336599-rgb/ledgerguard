import { createHash } from "node:crypto";
import { getAddress, isAddress, type Address } from "viem";

export const ARC_MAINNET_SHADOW_CHAIN_ID = 5_042;
export const ARC_MAINNET_SHADOW_USDC =
  "0x3600000000000000000000000000000000000000" as const;
export const ARC_MAINNET_SHADOW_GATEWAY_MINTER =
  "0x2222222d7164433c4C09B0b0D809a9b52C04C205" as const;

export interface ShadowContract {
  label: string;
  address: Address;
}

export interface ArcMainnetShadowConfiguration {
  enabled: boolean;
  ready: boolean;
  mode: "read-only-shadow";
  releaseStage: "pre-ga-observed";
  chainId: number;
  rpcUrls: readonly string[];
  rpcHosts: readonly string[];
  observerUrls: readonly string[];
  observerHosts: readonly string[];
  minimumHealthyRpcs: number;
  minimumHealthyObservers: number;
  maximumBlockLag: number;
  contracts: readonly ShadowContract[];
  configFingerprint: string | null;
  reason: string | null;
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  maximum: number,
): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= maximum
    ? parsed
    : fallback;
}

function parseHttpsUrls(configured: string | undefined): string[] {
  if (!configured) return [];

  const byHost = new Map<string, string>();
  for (const value of configured.split(",").map((item) => item.trim())) {
    try {
      const url = new URL(value);
      if (url.protocol === "https:" && !byHost.has(url.host)) {
        byHost.set(url.host, url.toString());
      }
    } catch {
      // Invalid URLs are excluded and make the readiness gate fail closed.
    }
  }
  return [...byHost.values()].slice(0, 4);
}

function parseAddress(
  value: string | undefined,
  fallback: Address,
): Address {
  return value && isAddress(value) ? getAddress(value) : fallback;
}

export function getArcMainnetShadowConfiguration(): ArcMainnetShadowConfiguration {
  const enabled = process.env.ARC_MAINNET_SHADOW_ENABLED === "true";
  const rpcUrls = parseHttpsUrls(process.env.ARC_MAINNET_SHADOW_RPC_URLS);
  const observerUrls = parseHttpsUrls(
    process.env.ARC_MAINNET_SHADOW_OBSERVER_URLS,
  );
  const minimumHealthyRpcs = parsePositiveInteger(
    process.env.ARC_MAINNET_SHADOW_MIN_HEALTHY_RPCS,
    1,
    4,
  );
  const minimumHealthyObservers = parsePositiveInteger(
    process.env.ARC_MAINNET_SHADOW_MIN_HEALTHY_OBSERVERS,
    1,
    4,
  );
  const maximumBlockLag = parsePositiveInteger(
    process.env.ARC_MAINNET_SHADOW_MAX_BLOCK_LAG,
    20,
    10_000,
  );
  const contracts: ShadowContract[] = [
    {
      label: "USDC",
      address: parseAddress(
        process.env.ARC_MAINNET_SHADOW_USDC_ADDRESS,
        ARC_MAINNET_SHADOW_USDC,
      ),
    },
    {
      label: "GatewayMinter",
      address: parseAddress(
        process.env.ARC_MAINNET_SHADOW_GATEWAY_MINTER_ADDRESS,
        ARC_MAINNET_SHADOW_GATEWAY_MINTER,
      ),
    },
  ];
  const ready =
    enabled &&
    rpcUrls.length >= minimumHealthyRpcs &&
    observerUrls.length >= minimumHealthyObservers;
  const canonical = ready
    ? JSON.stringify({
        chainId: ARC_MAINNET_SHADOW_CHAIN_ID,
        contracts: contracts.map(({ label, address }) => ({
          label,
          address: address.toLowerCase(),
        })),
        maximumBlockLag,
        minimumHealthyObservers,
        minimumHealthyRpcs,
        observerHosts: observerUrls.map((url) => new URL(url).host).sort(),
        rpcHosts: rpcUrls.map((url) => new URL(url).host).sort(),
      })
    : null;

  return {
    enabled,
    ready,
    mode: "read-only-shadow",
    releaseStage: "pre-ga-observed",
    chainId: ARC_MAINNET_SHADOW_CHAIN_ID,
    rpcUrls,
    rpcHosts: rpcUrls.map((url) => new URL(url).host),
    observerUrls,
    observerHosts: observerUrls.map((url) => new URL(url).host),
    minimumHealthyRpcs,
    minimumHealthyObservers,
    maximumBlockLag,
    contracts,
    configFingerprint: canonical
      ? createHash("sha256").update(canonical).digest("hex")
      : null,
    reason: !enabled
      ? "Shadow monitoring is disabled."
      : ready
        ? null
        : `At least ${minimumHealthyRpcs} full RPC and ${minimumHealthyObservers} independent observer are required.`,
  };
}
