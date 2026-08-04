import { createHash } from "node:crypto";
import { getAddress, isAddress } from "viem";

export const BASE_MAINNET_NETWORK = "eip155:8453";
export const BASE_MAINNET_USDC =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
/** USDbC — USDT bridged on Base (Tether canonical deployment, symbol USDbC). */
export const BASE_MAINNET_USDT =
  "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA";
export const BASE_MAINNET_USDC_EIP712_EXTRA = {
  name: "USD Coin",
  version: "2",
} as const;
export const CDP_X402_FACILITATOR =
  "https://api.cdp.coinbase.com/platform/v2/x402";
export const BASE_MAINNET_EVIDENCE_PATH = "/v1/paid/base/evidence";
export const BASE_MAINNET_ADAPTER_VERSION = "2026-07-30-v1";
const MAX_CANARY_PRICE_MICRO_USDC = 100_000n;

export type ActivationGate = {
  id: string;
  passed: boolean;
  description: string;
};

export type CommercialCandidate = {
  mode: "production-candidate";
  network: typeof BASE_MAINNET_NETWORK;
  asset: typeof BASE_MAINNET_USDC;
  facilitator: typeof CDP_X402_FACILITATOR;
  resourcePath: typeof BASE_MAINNET_EVIDENCE_PATH;
  adapterVersion: typeof BASE_MAINNET_ADAPTER_VERSION;
  configFingerprint: string;
  priceMicroUsdc: string;
  sellerAddress: string | null;
  requested: boolean;
  ready: boolean;
  realFundsEnabled: boolean;
  activationGates: ActivationGate[];
  reason: string;
};

function configuredSeller(): string | null {
  const value = process.env.SELLER_ADDRESS?.trim();
  return value && isAddress(value) ? getAddress(value) : null;
}

export function getBaseMainnetPriceMicroUsdc(): string {
  const value = process.env.BASE_MAINNET_PRICE_MICRO_USDC?.trim() ?? "1000";
  if (!/^[1-9][0-9]*$/.test(value)) return "0";
  return value;
}

export function getCommercialCandidate(): CommercialCandidate {
  const requested = process.env.BASE_MAINNET_X402_ENABLED === "true";
  const publicCanaryApproved =
    process.env.BASE_MAINNET_PUBLIC_CANARY_ENABLED === "true";
  const releaseApproved =
    process.env.BASE_MAINNET_RELEASE_APPROVAL ===
    "APPROVE_BASE_MAINNET_CANARY";
  const credentialsConfigured = Boolean(
    process.env.CDP_API_KEY_ID?.trim() &&
      process.env.CDP_API_KEY_SECRET?.trim(),
  );
  const sellerAddress = configuredSeller();
  const priceMicroUsdc = getBaseMainnetPriceMicroUsdc();
  const price = BigInt(priceMicroUsdc);
  const boundedCanaryPrice =
    price > 0n && price <= MAX_CANARY_PRICE_MICRO_USDC;
  const configFingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        adapterVersion: BASE_MAINNET_ADAPTER_VERSION,
        asset: BASE_MAINNET_USDC.toLowerCase(),
        facilitator: CDP_X402_FACILITATOR,
        network: BASE_MAINNET_NETWORK,
        priceMicroUsdc,
        resourcePath: BASE_MAINNET_EVIDENCE_PATH,
        sellerAddress: sellerAddress?.toLowerCase() ?? null,
      }),
    )
    .digest("hex");
  const fingerprintApproved =
    process.env.BASE_MAINNET_CONFIG_APPROVED_SHA256?.trim().toLowerCase() ===
    configFingerprint;
  const activationGates: ActivationGate[] = [
    {
      id: "explicit-enable",
      passed: requested,
      description: "BASE_MAINNET_X402_ENABLED is explicitly true.",
    },
    {
      id: "public-canary-enable",
      passed: publicCanaryApproved,
      description:
        "BASE_MAINNET_PUBLIC_CANARY_ENABLED separately exposes the real-fund public canary.",
    },
    {
      id: "real-funds-approval",
      passed: releaseApproved,
      description:
        "The action-time APPROVE_BASE_MAINNET_CANARY release phrase is present.",
    },
    {
      id: "cdp-credentials",
      passed: credentialsConfigured,
      description: "CDP facilitator credentials are configured.",
    },
    {
      id: "seller-address",
      passed: sellerAddress !== null,
      description: "A valid EVM settlement address is configured.",
    },
    {
      id: "bounded-canary-price",
      passed: boundedCanaryPrice,
      description:
        "The first-release price is between 1 and 100000 micro-USDC.",
    },
    {
      id: "reviewed-config-fingerprint",
      passed: fingerprintApproved,
      description:
        "The reviewed network, asset, recipient, price, and adapter fingerprint matches.",
    },
  ];
  const ready = activationGates.every((gate) => gate.passed);
  return {
    mode: "production-candidate",
    network: BASE_MAINNET_NETWORK,
    asset: BASE_MAINNET_USDC,
    facilitator: CDP_X402_FACILITATOR,
    resourcePath: BASE_MAINNET_EVIDENCE_PATH,
    adapterVersion: BASE_MAINNET_ADAPTER_VERSION,
    configFingerprint,
    priceMicroUsdc,
    sellerAddress,
    requested,
    ready,
    realFundsEnabled: ready,
    activationGates,
    reason: ready
      ? "All independent activation gates passed."
      : "Mainnet charging remains fail-closed until every activation gate passes.",
  };
}
