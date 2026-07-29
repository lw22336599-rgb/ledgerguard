import { BatchFacilitatorClient } from "@circle-fin/x402-batching/server";
import { getAddress, type Address } from "viem";
import { z } from "zod";
import { ARC_TESTNET_USDC } from "../config/networks.js";
import { withDeadline } from "../lib/rpc.js";

const ARC_NETWORK = "eip155:5042002";
const GATEWAY_URL = "https://gateway-api-testnet.circle.com";
const DEFAULT_PRICE_MICRO_USDC = "1000";

const paymentPayloadSchema = z.object({
  x402Version: z.literal(2),
  resource: z
    .object({
      url: z.string(),
      description: z.string(),
      mimeType: z.string(),
    })
    .optional(),
  accepted: z.record(z.string(), z.unknown()).optional(),
  payload: z.record(z.string(), z.unknown()),
  extensions: z.record(z.string(), z.unknown()).optional(),
});

interface SupportedKind {
  x402Version: number;
  scheme: string;
  network: string;
  extra?: Record<string, unknown>;
}

interface PaymentPayload {
  x402Version: number;
  resource?: {
    url: string;
    description: string;
    mimeType: string;
  };
  accepted?: Record<string, unknown>;
  payload: Record<string, unknown>;
  extensions?: Record<string, unknown>;
}

export interface PaymentRequirements {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: Address;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
}

export interface SettlementResult {
  success: boolean;
  errorReason?: string;
  payer?: string;
  transaction: string;
  network: string;
}

export class InvalidPaymentSignatureError extends Error {
  constructor() {
    super("The x402 payment signature is malformed.");
    this.name = "InvalidPaymentSignatureError";
  }
}

let supportedKindCache:
  | { value: SupportedKind; expiresAt: number }
  | undefined;

function getSellerAddress(): Address {
  const configured = process.env.SELLER_ADDRESS?.trim();
  if (!configured) {
    throw new Error("SELLER_ADDRESS is not configured.");
  }
  return getAddress(configured);
}

export function x402Enabled(): boolean {
  return process.env.X402_ENABLED === "true";
}

export function getConfiguredX402PriceMicroUsdc(): string {
  const configured =
    process.env.X402_PRICE_MICRO_USDC?.trim() || DEFAULT_PRICE_MICRO_USDC;
  if (!/^[1-9][0-9]{0,8}$/.test(configured)) {
    throw new Error(
      "X402_PRICE_MICRO_USDC must be an integer from 1 to 999999999.",
    );
  }
  return configured;
}

export async function getArcPaymentRequirements(): Promise<PaymentRequirements> {
  if (supportedKindCache && supportedKindCache.expiresAt > Date.now()) {
    return buildRequirements(supportedKindCache.value);
  }

  const client = new BatchFacilitatorClient({ url: GATEWAY_URL });
  const supported = await withDeadline(client.getSupported(), 8_000);
  const kind = supported.kinds.find(
    (candidate) =>
      candidate.network === ARC_NETWORK && candidate.scheme === "exact",
  );
  if (!kind) {
    throw new Error("Circle Gateway does not currently advertise Arc Testnet.");
  }
  supportedKindCache = {
    value: kind,
    expiresAt: Date.now() + 5 * 60_000,
  };
  return buildRequirements(kind);
}

function buildRequirements(kind: SupportedKind): PaymentRequirements {
  return {
    scheme: "exact",
    network: ARC_NETWORK,
    asset: ARC_TESTNET_USDC,
    amount: getConfiguredX402PriceMicroUsdc(),
    payTo: getSellerAddress(),
    maxTimeoutSeconds: 604_900,
    ...(kind.extra ? { extra: kind.extra } : {}),
  };
}

export function encodePaymentRequired(
  resourceUrl: string,
  requirements: PaymentRequirements,
): string {
  return Buffer.from(
    JSON.stringify({
      x402Version: 2,
      resource: {
        url: resourceUrl,
        description: "LedgerGuard Arc network risk snapshot",
        mimeType: "application/json",
      },
      accepts: [requirements],
    }),
  ).toString("base64");
}

export function decodePaymentSignature(header: string): PaymentPayload {
  if (header.length > 32_768) {
    throw new InvalidPaymentSignatureError();
  }
  try {
    const json = Buffer.from(header, "base64").toString("utf8");
    const parsed = paymentPayloadSchema.parse(JSON.parse(json));
    return {
      x402Version: parsed.x402Version,
      payload: parsed.payload,
      ...(parsed.resource ? { resource: parsed.resource } : {}),
      ...(parsed.accepted ? { accepted: parsed.accepted } : {}),
      ...(parsed.extensions ? { extensions: parsed.extensions } : {}),
    };
  } catch (error) {
    if (error instanceof InvalidPaymentSignatureError) throw error;
    throw new InvalidPaymentSignatureError();
  }
}

export async function settlePayment(
  signatureHeader: string,
  requirements: PaymentRequirements,
): Promise<SettlementResult> {
  const payload = decodePaymentSignature(signatureHeader);
  const client = new BatchFacilitatorClient({ url: GATEWAY_URL });
  const result = await withDeadline(client.settle(payload, requirements), 12_000);
  if (result.success && result.network !== requirements.network) {
    throw new Error("Facilitator returned an unexpected settlement network.");
  }
  return result;
}
