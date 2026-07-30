import { getAddress, isAddress, type Address } from "viem";

export const ROUTE_MAX_AMOUNT_USDC = "0.001";
export const ROUTE_CUSTOM_FEE_USDC = "0.000001";

export function getRouteFeeRecipient(): Address | null {
  const configured = process.env.SELLER_ADDRESS?.trim();
  return configured && isAddress(configured) ? getAddress(configured) : null;
}
