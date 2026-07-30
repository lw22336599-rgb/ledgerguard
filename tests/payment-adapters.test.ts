import { describe, expect, it } from "vitest";
import {
  adaptX402ReceiptToEvidence,
  paymentAdapterRegistry,
} from "../src/adapters/payment-context.js";

describe("payment protocol adapters", () => {
  it("converts an x402 receipt plus declared intent into evidence input", () => {
    expect(
      adaptX402ReceiptToEvidence({
        receipt: {
          network: "arcTestnet",
          payer: "0x1111111111111111111111111111111111111111",
          settlementTransaction: `0x${"a".repeat(64)}`,
          amountMicroUsdc: "1000000",
        },
        declaredIntent: {
          action: "transfer",
          expectedRecipient: "0x2222222222222222222222222222222222222222",
          expectedAssetAddress: "0x3600000000000000000000000000000000000000",
          purpose: "Agent API purchase",
        },
      }),
    ).toMatchObject({
      network: "arcTestnet",
      txHash: `0x${"a".repeat(64)}`,
      intent: {
        expectedDebitAddress: "0x1111111111111111111111111111111111111111",
        expectedAmountMicroUsdc: "1000000",
      },
    });
  });

  it("marks AP2 as interface-only and never as implemented support", () => {
    expect(paymentAdapterRegistry).toContainEqual(
      expect.objectContaining({
        id: "ap2-mandate",
        status: "interface-only",
        enabled: false,
        signing: false,
      }),
    );
  });
});
