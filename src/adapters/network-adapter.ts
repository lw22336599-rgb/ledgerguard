import {
  getNetworkRegistry,
  requireEnabledNetwork,
  type NetworkName,
  type NetworkRecord,
} from "../config/networks.js";

export class NetworkDisabledError extends Error {
  readonly code = "NETWORK_DISABLED";

  constructor(readonly network: string) {
    super(
      `Network "${network}" is disabled until official parameters and release approval are present.`,
    );
    this.name = "NetworkDisabledError";
  }
}

export type NetworkAdapter = {
  name: NetworkName;
  displayName: string;
  lifecycle: NetworkRecord["lifecycle"];
  enabled: boolean;
  chainId: number;
  usdcAddress: `0x${string}`;
  /** Supported stablecoin assets for this network (USDC always first). */
  supportedAssets: readonly `0x${string}`[];
  /** Arc uses native USDC gas (18-decimal wei view); Base uses ERC-20 USDC (6 decimals). */
  nativeUsdcGas: boolean;
  explorerUrl: string | null;
  rpcUrls: readonly string[];
};

function toAdapter(record: NetworkRecord): NetworkAdapter | null {
  if (
    !record.enabled ||
    !record.officialParametersComplete ||
    record.chainId === null ||
    record.usdcAddress === null
  ) {
    return null;
  }
  return {
    name: record.name,
    displayName: record.displayName,
    lifecycle: record.lifecycle,
    enabled: true,
    chainId: record.chainId,
    usdcAddress: record.usdcAddress,
    supportedAssets: record.supportedAssets,
    nativeUsdcGas: record.name === "arcTestnet" || record.name === "arcMainnet",
    explorerUrl: record.explorerUrl,
    rpcUrls: record.rpcUrls,
  };
}

export function listNetworkAdapters(): NetworkAdapter[] {
  return Object.values(getNetworkRegistry())
    .map((record) => toAdapter(record))
    .filter((adapter): adapter is NetworkAdapter => adapter !== null);
}

export function resolveNetworkAdapter(name: NetworkName): NetworkAdapter {
  try {
    const record = requireEnabledNetwork(name);
    const adapter = toAdapter(record);
    if (!adapter) throw new NetworkDisabledError(name);
    return adapter;
  } catch {
    throw new NetworkDisabledError(name);
  }
}

export function getOfficialUsdcAddress(name: NetworkName): `0x${string}` {
  return resolveNetworkAdapter(name).usdcAddress;
}

export function isSupportedNetworkName(value: string): value is NetworkName {
  return value in getNetworkRegistry();
}

export function parseNetworkName(value: unknown): NetworkName | null {
  if (typeof value !== "string") return null;
  return isSupportedNetworkName(value) ? value : null;
}

export function assertHttpsWebhook(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Webhook URL must be a valid absolute URL.");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Webhook URL must use HTTPS.");
  }
}
