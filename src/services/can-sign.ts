import { resolveNetworkAdapter } from "../adapters/network-adapter.js";
import type { CanSignInput, PreflightInput } from "../schemas.js";

export function canSignToPreflight(input: CanSignInput): PreflightInput {
  const adapter = resolveNetworkAdapter(input.network);
  const assetAddress = input.assetAddress ?? adapter.usdcAddress;
  const debit = input.payer ?? input.from;

  return {
    network: input.network,
    to: input.to,
    data: input.data,
    valueWei: input.valueWei,
    ...(debit ? { from: debit } : {}),
    intent: {
      action: "transfer",
      expectedRecipient: input.recipient,
      expectedAssetAddress: assetAddress,
      expectedAmountMicroUsdc: input.amountMicroUsdc,
      purpose: input.purpose,
      ...(debit ? { expectedDebitAddress: debit } : {}),
    },
    policy: {
      allowUnlimitedApproval: false,
      requireSimulation: input.requireSimulation,
      ...(input.maxAmountMicroUsdc
        ? { maxAmountMicroUsdc: input.maxAmountMicroUsdc }
        : {}),
    },
  };
}
