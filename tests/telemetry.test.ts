import { describe, expect, it } from "vitest";
import { privacySafeTelemetrySchema } from "../src/domain/telemetry.js";

const digest = `sha256:${"a".repeat(64)}`;

describe("privacy-safe telemetry contract", () => {
  const event = {
    schemaVersion: "ledgerguard.telemetry.v1",
    eventId: digest,
    occurredAt: "2026-08-04T00:00:00.000Z",
    consent: true,
    network: "eip155:8453",
    integrationIdHash: digest,
    intentDigest: digest,
    decision: "BLOCK",
    signalCodes: ["RECIPIENT_MISMATCH"],
    outcome: "USER_CANCELLED",
    evaluatorVersion: "0.1.0",
    privacy: {
      containsRawAddress: false,
      containsCalldata: false,
      containsPurpose: false,
    },
  } as const;

  it("accepts opt-in derived signals without raw transaction data", () => {
    expect(privacySafeTelemetrySchema.parse(event).decision).toBe("BLOCK");
  });

  it("rejects undeclared raw address fields", () => {
    expect(() =>
      privacySafeTelemetrySchema.parse({
        ...event,
        recipient: "0x2222222222222222222222222222222222222222",
      }),
    ).toThrow();
  });

  it("rejects telemetry without explicit consent", () => {
    expect(() =>
      privacySafeTelemetrySchema.parse({ ...event, consent: false }),
    ).toThrow();
  });
});
