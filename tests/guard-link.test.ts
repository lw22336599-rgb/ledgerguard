import { describe, expect, it } from "vitest";
import {
  createGuardLinkUrl,
  createGuardLinkPreflight,
  guardLinkIntentId,
  guardLinkQuerySchema,
  isGuardLinkExpired,
} from "../src/services/guard-link.js";
import { ARC_TESTNET_USDC } from "../src/config/networks.js";

describe("prefilled Guard Link", () => {
  it("turns a human-readable query into one deterministic Arc preflight", () => {
    const query = guardLinkQuerySchema.parse({
      payer: "0x1111111111111111111111111111111111111111",
      recipient: "0x2222222222222222222222222222222222222222",
      amount: "1.25",
      limit: "2",
      purpose: "Invoice 42",
    });
    const input = createGuardLinkPreflight(query);

    expect(input).toMatchObject({
      network: "arcTestnet",
      from: query.payer,
      to: ARC_TESTNET_USDC,
      intent: {
        action: "transfer",
        expectedDebitAddress: query.payer,
        expectedRecipient: query.recipient,
        expectedAmountMicroUsdc: "1250000",
        purpose: "Invoice 42",
      },
      policy: {
        maxAmountMicroUsdc: "2000000",
        requireSimulation: true,
      },
    });
    expect(input.data).toMatch(/^0xa9059cbb[0-9a-f]+$/);
  });

  it("supports an explicit expiry and detects stale links", () => {
    const query = guardLinkQuerySchema.parse({
      recipient: "0x2222222222222222222222222222222222222222",
      amount: "1",
      purpose: "Time-bound invoice",
      expires: "2030-01-01T00:00:00.000Z",
    });
    expect(isGuardLinkExpired(query, new Date("2029-12-31T23:59:59Z"))).toBe(
      false,
    );
    expect(isGuardLinkExpired(query, new Date("2030-01-01T00:00:01Z"))).toBe(
      true,
    );
  });

  it("creates a stable, encoded public link and intent reference", () => {
    const query = guardLinkQuerySchema.parse({
      issuer: "Example Agent",
      recipient: "0x2222222222222222222222222222222222222222",
      amount: "1.25",
      limit: "2",
      purpose: "Invoice 42 & delivery",
      expires: "2030-01-01T00:00:00.000Z",
    });
    const url = createGuardLinkUrl("https://ledgerguard.example", query);
    expect(url).toContain("issuer=Example+Agent");
    expect(url).toContain("purpose=Invoice+42+%26+delivery");
    expect(url).toContain("expires=2030-01-01T00%3A00%3A00.000Z");
    expect(guardLinkIntentId(query)).toMatch(/^[0-9a-f]{20}$/);
    expect(guardLinkIntentId(query)).toBe(guardLinkIntentId(query));
  });

  it("rejects zero, over-precision, and unsafe purpose input", () => {
    for (const amount of ["0", "1.0000001", "-1"]) {
      expect(
        guardLinkQuerySchema.safeParse({
          recipient: "0x2222222222222222222222222222222222222222",
          amount,
          purpose: "Test",
        }).success,
      ).toBe(false);
    }
    expect(
      guardLinkQuerySchema.safeParse({
        recipient: "0x2222222222222222222222222222222222222222",
        amount: "1",
        purpose: "<script>alert(1)</script>",
      }).success,
    ).toBe(false);
    expect(
      guardLinkQuerySchema.safeParse({
        issuer: "<script>",
        recipient: "0x2222222222222222222222222222222222222222",
        amount: "1",
        purpose: "Test",
      }).success,
    ).toBe(false);
  });
});
