import { describe, expect, it } from "vitest";
import {
  canonicalDigest,
  controlDecisionSchema,
  controlIntentSchema,
  controlIntentV2Schema,
  controlReceiptSchema,
  migrateControlIntentV1ToV2,
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

  it("accepts a canonical V2 intent with explicit CAIP-19 asset precision", () => {
    const parsed = controlIntentV2Schema.parse({
      ...baseIntent,
      schemaVersion: "ledgerguard.intent.v2",
      operation: { ...baseIntent.operation, assetDecimals: 6 },
    });
    expect(parsed.operation.assetDecimals).toBe(6);
  });

  it("rejects V2 payments with missing precision or a mismatched asset network", () => {
    expect(() =>
      controlIntentV2Schema.parse({
        ...baseIntent,
        schemaVersion: "ledgerguard.intent.v2",
      }),
    ).toThrow(/assetDecimals is required/i);
    expect(() =>
      controlIntentV2Schema.parse({
        ...baseIntent,
        schemaVersion: "ledgerguard.intent.v2",
        operation: {
          ...baseIntent.operation,
          asset: "eip155:1/erc20:0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          assetDecimals: 6,
        },
      }),
    ).toThrow(/asset network must match/i);
  });

  it("migrates V1 only with caller-supplied verified asset metadata", () => {
    const migrated = migrateControlIntentV1ToV2(baseIntent, {
      caip19: baseIntent.operation.asset,
      decimals: 6,
    });
    expect(migrated.schemaVersion).toBe("ledgerguard.intent.v2");
    expect(migrated.operation.assetDecimals).toBe(6);
    expect(() =>
      migrateControlIntentV1ToV2(baseIntent, {
        caip19: "eip155:1/erc20:0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        decimals: 6,
      }),
    ).toThrow(/asset network must match/i);
  });

  it("enforces lifecycle and operation-specific V1 boundaries", () => {
    expect(() =>
      controlIntentSchema.parse({
        ...baseIntent,
        expiresAt: "2026-08-03T00:00:00.000Z",
      }),
    ).toThrow(/later than createdAt/i);
    expect(() =>
      controlIntentSchema.parse({
        ...baseIntent,
        operation: { kind: "contract_call", network: "eip155:8453", purpose: "Call" },
      }),
    ).toThrow(/to is required/i);
    expect(
      controlIntentSchema.parse({
        ...baseIntent,
        operation: {
          kind: "contract_call",
          network: "eip155:8453",
          to: baseIntent.operation.to,
          purpose: "Call",
        },
      }).operation.kind,
    ).toBe("contract_call");
    expect(
      controlIntentSchema.parse({
        ...baseIntent,
        operation: { ...baseIntent.operation, kind: "approval", amountAtomic: "0" },
      }).operation.amountAtomic,
    ).toBe("0");
  });

  it("enforces V2 expiry, contract-call, zero-value, and migration branches", () => {
    const v2 = {
      ...baseIntent,
      schemaVersion: "ledgerguard.intent.v2",
      operation: { ...baseIntent.operation, assetDecimals: 6 },
    } as const;
    expect(() => controlIntentV2Schema.parse({ ...v2, expiresAt: baseIntent.createdAt })).toThrow(
      /later than createdAt/i,
    );
    expect(() =>
      controlIntentV2Schema.parse({
        ...v2,
        operation: { kind: "contract_call", network: "eip155:8453", purpose: "Call" },
      }),
    ).toThrow(/to is required/i);
    expect(
      controlIntentV2Schema.parse({
        ...v2,
        operation: {
          kind: "contract_call",
          network: "eip155:8453",
          to: baseIntent.operation.to,
          purpose: "Call",
        },
      }).operation.kind,
    ).toBe("contract_call");
    expect(() =>
      controlIntentV2Schema.parse({
        ...v2,
        operation: { ...v2.operation, amountAtomic: "0" },
      }),
    ).toThrow(/greater than zero/i);
    expect(
      controlIntentV2Schema.parse({
        ...v2,
        operation: { ...v2.operation, kind: "approval", amountAtomic: "0" },
      }).operation.amountAtomic,
    ).toBe("0");

    const contractV1 = {
      ...baseIntent,
      operation: {
        kind: "contract_call",
        network: "eip155:8453",
        to: baseIntent.operation.to,
        purpose: "Call",
      },
    };
    expect(
      migrateControlIntentV1ToV2(contractV1, {
        caip19: baseIntent.operation.asset,
        decimals: 6,
      }).operation.asset,
    ).toBeUndefined();
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

  it("canonicalizes JSON primitives and rejects unsupported values", () => {
    expect(canonicalDigest([null, true, "x", 2])).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(canonicalDigest({ kept: 1, removed: undefined })).toBe(canonicalDigest({ kept: 1 }));
    expect(() => canonicalDigest(Number.POSITIVE_INFINITY)).toThrow(/non-finite/i);
    expect(() => canonicalDigest(1n)).toThrow(/does not support bigint/i);
  });
});
