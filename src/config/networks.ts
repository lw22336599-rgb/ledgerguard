import { createHash } from "node:crypto";
import { isAddress } from "viem";
import { arcTestnet } from "viem/chains";

export const ARC_TESTNET_USDC =
  "0x3600000000000000000000000000000000000000" as const;

export type NetworkName = "arcTestnet" | "arcMainnet";

export interface NetworkRecord {
  name: NetworkName;
  displayName: string;
  lifecycle: "testnet" | "mainnet";
  enabled: boolean;
  officialParametersComplete: boolean;
  chainId: number | null;
  rpcUrls: readonly string[];
  usdcAddress: `0x${string}` | null;
  explorerUrl: string | null;
  activation:
    | "automatic-safe"
    | "manual-required"
    | "manual-canary"
    | "disabled";
  configFingerprint: string | null;
}

function parseRpcUrls(): string[] {
  const configured = process.env.ARC_TESTNET_RPC_URLS;
  if (!configured) return ["https://rpc.testnet.arc.network"];

  const urls = configured
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.startsWith("https://"));

  return urls.length > 0
    ? [...new Set(urls)].slice(0, 3)
    : ["https://rpc.testnet.arc.network"];
}

function parseMainnetConfiguration(): Omit<
  NetworkRecord,
  "name" | "displayName" | "lifecycle"
> {
  const chainIdText = process.env.ARC_MAINNET_CHAIN_ID?.trim();
  const rpcUrl = process.env.ARC_MAINNET_RPC_URL?.trim();
  const usdcAddress = process.env.ARC_MAINNET_USDC_ADDRESS?.trim();
  const explorerUrl = process.env.ARC_MAINNET_EXPLORER_URL?.trim();
  const chainId = chainIdText ? Number(chainIdText) : null;
  const complete =
    Number.isSafeInteger(chainId) &&
    (chainId ?? 0) > 0 &&
    Boolean(rpcUrl?.startsWith("https://")) &&
    Boolean(usdcAddress && isAddress(usdcAddress)) &&
    Boolean(explorerUrl?.startsWith("https://"));

  if (!complete) {
    return {
      enabled: false,
      officialParametersComplete: false,
      chainId: null,
      rpcUrls: [],
      usdcAddress: null,
      explorerUrl: null,
      activation: "disabled",
      configFingerprint: null,
    };
  }

  const canonical = JSON.stringify({
    chainId,
    explorerUrl,
    rpcUrl,
    usdcAddress: usdcAddress!.toLowerCase(),
  });
  const configFingerprint = createHash("sha256")
    .update(canonical)
    .digest("hex");
  const approvalMatches =
    process.env.ARC_MAINNET_CONFIG_APPROVED_SHA256?.trim().toLowerCase() ===
    configFingerprint;
  const releaseApproved =
    process.env.ARC_MAINNET_RELEASE_APPROVAL ===
    "APPROVE_ARC_MAINNET_CANARY";
  const enabled =
    process.env.ARC_MAINNET_ENABLED === "true" &&
    approvalMatches &&
    releaseApproved;

  return {
    enabled,
    officialParametersComplete: true,
    chainId,
    rpcUrls: [rpcUrl!],
    usdcAddress: usdcAddress as `0x${string}`,
    explorerUrl: explorerUrl!,
    activation: enabled ? "manual-canary" : "manual-required",
    configFingerprint,
  };
}

export function getNetworkRegistry(): Record<NetworkName, NetworkRecord> {
  return {
    arcTestnet: {
      name: "arcTestnet",
      displayName: "Arc Testnet",
      lifecycle: "testnet",
      enabled: true,
      officialParametersComplete: true,
      chainId: arcTestnet.id,
      rpcUrls: parseRpcUrls(),
      usdcAddress: ARC_TESTNET_USDC,
      explorerUrl: "https://testnet.arcscan.app",
      activation: "automatic-safe",
      configFingerprint: null,
    },
    arcMainnet: {
      name: "arcMainnet",
      displayName: "Arc Mainnet",
      lifecycle: "mainnet",
      ...parseMainnetConfiguration(),
    },
  };
}

export function requireEnabledNetwork(name: NetworkName): NetworkRecord {
  const network = getNetworkRegistry()[name];
  if (
    !network.enabled ||
    !network.officialParametersComplete ||
    network.chainId === null ||
    network.usdcAddress === null
  ) {
    throw new Error(
      `${network.displayName} is disabled until official parameters and human approval are present.`,
    );
  }
  return network;
}
