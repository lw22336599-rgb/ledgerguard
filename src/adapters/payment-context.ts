import { evidenceSchema, type EvidenceInput } from "../schemas.js";

export type X402ReceiptContext = {
  receipt: {
    network: "arcTestnet" | "arcMainnet";
    payer: string;
    settlementTransaction: string;
    amountMicroUsdc: string;
  };
  declaredIntent: {
    action: "transfer" | "approve" | "contract_call";
    expectedRecipient?: string;
    expectedAssetAddress?: string;
    purpose: string;
  };
};

export type PaymentProtocolAdapter = {
  id: "x402-receipt" | "ap2-mandate";
  status: "implemented-read-only" | "interface-only";
  enabled: boolean;
  signing: false;
  description: string;
};

export const paymentAdapterRegistry: PaymentProtocolAdapter[] = [
  {
    id: "x402-receipt",
    status: "implemented-read-only",
    enabled: true,
    signing: false,
    description:
      "Normalizes a declared x402 settlement receipt for deterministic evidence verification.",
  },
  {
    id: "ap2-mandate",
    status: "interface-only",
    enabled: false,
    signing: false,
    description:
      "Reserved boundary only. No AP2 parser, verifier, signing, or protocol support is enabled.",
  },
];

export function adaptX402ReceiptToEvidence(
  input: X402ReceiptContext,
): EvidenceInput {
  return evidenceSchema.parse({
    network: input.receipt.network,
    txHash: input.receipt.settlementTransaction,
    intent: {
      ...input.declaredIntent,
      expectedDebitAddress: input.receipt.payer,
      expectedAmountMicroUsdc: input.receipt.amountMicroUsdc,
    },
  });
}
