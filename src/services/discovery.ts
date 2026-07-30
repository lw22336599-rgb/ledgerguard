import { declareDiscoveryExtension } from "@x402/extensions/bazaar";

export function strictEvidenceDiscoveryExtension(): Record<string, unknown> {
  return declareDiscoveryExtension({
    bodyType: "json",
    input: {
      network: "arcTestnet",
      txHash: `0x${"0".repeat(64)}`,
      intent: {
        action: "transfer",
        expectedDebitAddress: "0x1111111111111111111111111111111111111111",
        expectedRecipient: "0x2222222222222222222222222222222222222222",
        expectedAssetAddress: "0x3600000000000000000000000000000000000000",
        expectedAmountMicroUsdc: "1000000",
        purpose: "Verify an agent payment",
      },
    },
    inputSchema: {
      type: "object",
      properties: {
        network: { type: "string", const: "arcTestnet" },
        txHash: { type: "string", pattern: "^0x[0-9a-fA-F]{64}$" },
        intent: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["transfer", "approve", "contract_call"] },
            expectedDebitAddress: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
            expectedRecipient: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
            expectedAssetAddress: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
            expectedAmountMicroUsdc: { type: "string", pattern: "^[0-9]+$" },
            purpose: { type: "string" },
          },
          required: ["action", "purpose"],
        },
      },
      required: ["network", "txHash", "intent"],
    },
    output: {
      example: {
        paid: true,
        deliverable: "strict-evidence-receipt",
        evidence: { status: "VERIFIED", evidenceHash: `0x${"0".repeat(64)}` },
      },
    },
  });
}
