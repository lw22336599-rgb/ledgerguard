import { getAddress, isAddress } from "viem";
import { CDP_X402_FACILITATOR, type ActivationGate } from "./commercial.js";

export const BASE_SEPOLIA_NETWORK = "eip155:84532";
export const BASE_SEPOLIA_USDC =
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export type BazaarCandidate = {
  mode: "bazaar-testnet-candidate";
  lifecycle: "testnet";
  network: typeof BASE_SEPOLIA_NETWORK;
  asset: typeof BASE_SEPOLIA_USDC;
  facilitator: typeof CDP_X402_FACILITATOR;
  sellerAddress: string | null;
  requested: boolean;
  ready: boolean;
  settleEnabled: boolean;
  testAssetsOnly: true;
  indexed: false;
  indexingProof: null;
  activationGates: ActivationGate[];
  reason: string;
};

function configuredSeller(): string | null {
  const value = process.env.SELLER_ADDRESS?.trim();
  return value && isAddress(value) ? getAddress(value) : null;
}

export function getBazaarCandidate(): BazaarCandidate {
  const requested = process.env.BASE_SEPOLIA_X402_ENABLED === "true";
  const credentialsConfigured = Boolean(
    process.env.CDP_API_KEY_ID?.trim() &&
      process.env.CDP_API_KEY_SECRET?.trim(),
  );
  const sellerAddress = configuredSeller();
  const activationGates: ActivationGate[] = [
    {
      id: "explicit-testnet-enable",
      passed: requested,
      description: "BASE_SEPOLIA_X402_ENABLED is explicitly true.",
    },
    {
      id: "cdp-credentials",
      passed: credentialsConfigured,
      description:
        "CDP credentials are configured for facilitator verification and settlement.",
    },
    {
      id: "seller-address",
      passed: sellerAddress !== null,
      description: "A valid public EVM settlement address is configured.",
    },
  ];
  const ready = activationGates.every((gate) => gate.passed);

  return {
    mode: "bazaar-testnet-candidate",
    lifecycle: "testnet",
    network: BASE_SEPOLIA_NETWORK,
    asset: BASE_SEPOLIA_USDC,
    facilitator: CDP_X402_FACILITATOR,
    sellerAddress,
    requested,
    ready,
    settleEnabled: ready,
    testAssetsOnly: true,
    indexed: false,
    indexingProof: null,
    activationGates,
    reason:
      "Bazaar indexing is unproven until a successful CDP testnet settlement completes and this exact resource is found through CDP discovery.",
  };
}
