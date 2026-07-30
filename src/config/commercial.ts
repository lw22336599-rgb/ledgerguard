import { getAddress, isAddress } from "viem";

export const BASE_MAINNET_NETWORK = "eip155:8453";
export const BASE_MAINNET_USDC =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const CDP_X402_FACILITATOR =
  "https://api.cdp.coinbase.com/platform/v2/x402";
const PRODUCTION_SETTLEMENT_ADAPTER_IMPLEMENTED = false;

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

export function getCommercialCandidate(): CommercialCandidate {
  const requested = process.env.BASE_MAINNET_X402_ENABLED === "true";
  const approved = process.env.REAL_FUNDS_APPROVED === "true";
  const credentialsConfigured = Boolean(
    process.env.CDP_API_KEY_ID?.trim() &&
      process.env.CDP_API_KEY_SECRET?.trim(),
  );
  const sellerAddress = configuredSeller();
  const activationGates: ActivationGate[] = [
    {
      id: "explicit-enable",
      passed: requested,
      description: "BASE_MAINNET_X402_ENABLED is explicitly true.",
    },
    {
      id: "real-funds-approval",
      passed: approved,
      description: "A human has explicitly approved real-funds activation.",
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
      id: "production-settlement-adapter",
      passed: PRODUCTION_SETTLEMENT_ADAPTER_IMPLEMENTED,
      description:
        "The Base mainnet settlement adapter has passed an independent production test.",
    },
  ];
  const ready = activationGates.every((gate) => gate.passed);
  return {
    mode: "production-candidate",
    network: BASE_MAINNET_NETWORK,
    asset: BASE_MAINNET_USDC,
    facilitator: CDP_X402_FACILITATOR,
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
