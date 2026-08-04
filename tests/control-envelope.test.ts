import { describe, expect, it } from "vitest";
import {
  canonicalDigest,
  controlDecisionSchema,
  controlIntentSchema,
  controlReceiptSchema,
} from "../src/domain/control-envelope.js";

const baseIntent = {
  schemaVersion: "ledgerguard.intent.v1",
  id: "intent_checkout_42",
  createdAt: "2026-08-04T00:00:00.000Z",
  actor: { kind: "agent", id: "merchant-checkout" },
  operation: {
    kind: "payment",
    network: "eip155:8453",
    from: "did:pkh:eip155:8453:0x1111111111111111111111111111111111111111",
    to: "0x2222222222222222222222222222222222222222",
    asset: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    amountAtomic: "1000000",
    purpose: "Invoice 42",
  },
  source: { protocol: "x402", reference: "checkout-42" },
} as const;

describe("protocol-neutral control envelope", () => {
  it("accepts a payment intent without coupling the core to a payment protocol", () => {
    const parsed = controlIntentSchema.parse(baseIntent);
    expect(parsed.operation.network).toBe("eip155:8453");
    expect(parsed.source?.protocol).toBe("x402");
  });

  it("accepts the same core intent without any adapter source", () => {
    const { source: _source, ...withoutSource } = baseIntent;
    expect(controlIntentSchema.parse(withoutSource).source).toBeUndefined();
  });

  it("rejects zero-value payment intents", () => {
    expect(() =>
      controlIntentSchema.parse({
        ...baseIntent,
        operation: { ...baseIntent.operation, amountAtomic: "0" },
      }),
    ).toThrow(/greater than zero/i);
  });

  it("requires payment recipient, asset, and amount", () => {
    const { to: _to, ...operation } = baseIntent.operation;
    expect(() => controlIntentSchema.parse({ ...baseIntent, operation })).toThrow(/to is required/i);
  });

  it("validates a deterministic decision record", () => {
    const decision = controlDecisionSchema.parse({
      schemaVersion: "ledgerguard.decision.v1",
      id: "decision_checkout_42",
      intentId: baseIntent.id,
      policyId: "policy_checkout",
      evaluatedAt: "2026-08-04T00:00:01.000Z",
      evaluator: { name: "ledgerguard", version: "0.1.0" },
      decision: "REVIEW",
      findings: [{ code: "HUMAN_REVIEW_REQUIRED", severity: "warning", message: "Review threshold reached." }],
    });
    expect(decision.decision).toBe("REVIEW");
  });

  it("validates a post-settlement evidence receipt", () => {
    const receipt = controlReceiptSchema.parse({
      schemaVersion: "ledgerguard.receipt.v1",
      id: "receipt_checkout_42",
      intentId: baseIntent.id,
      observedAt: "2026-08-04T00:01:00.000Z",
      network: "eip155:8453",
      transactionId: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      status: "VERIFIED",
      evidenceHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    });
    expect(receipt.status).toBe("VERIFIED");
  });

  it("produces the same digest for objects with different key order", () => {
    expect(canonicalDigest({ b: 2, a: { d: 4, c: 3 } })).toBe(
      canonicalDigest({ a: { c: 3, d: 4 }, b: 2 }),
    );
  });
});
