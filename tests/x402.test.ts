import { Buffer } from "node:buffer";
import { beforeEach, describe, expect, it } from "vitest";
import {
  decodePaymentSignature,
  encodePaymentRequired,
  getConfiguredX402PriceMicroUsdc,
  x402Enabled,
} from "../src/services/x402.js";

describe("x402 boundary", () => {
  beforeEach(() => {
    process.env.X402_ENABLED = "false";
  });

  it("stays disabled unless explicitly enabled", () => {
    expect(x402Enabled()).toBe(false);
    process.env.X402_ENABLED = "true";
    expect(x402Enabled()).toBe(true);
  });

  it("encodes a standards-shaped payment requirement", () => {
    const header = encodePaymentRequired("https://example.test/paid", {
      scheme: "exact",
      network: "eip155:5042002",
      asset: "0x3600000000000000000000000000000000000000",
      amount: "1000",
      payTo: "0xF1437D9cD304ae49F2Ec005AC967813b3a7C466C",
      maxTimeoutSeconds: 604_900,
    });
    const decoded = JSON.parse(Buffer.from(header, "base64").toString("utf8"));

    expect(decoded.x402Version).toBe(2);
    expect(decoded.accepts[0].amount).toBe("1000");
  });

  it("rejects malformed payment signatures before calling the facilitator", () => {
    const malformed = Buffer.from(JSON.stringify({ x402Version: 2 })).toString(
      "base64",
    );
    expect(() => decodePaymentSignature(malformed)).toThrow();
  });

  it("rejects unsupported x402 versions", () => {
    const unsupported = Buffer.from(
      JSON.stringify({ x402Version: 1, payload: {} }),
    ).toString("base64");
    expect(() => decodePaymentSignature(unsupported)).toThrow();
  });

  it("rejects invalid or unbounded prices", () => {
    process.env.X402_PRICE_MICRO_USDC = "0";
    expect(() => getConfiguredX402PriceMicroUsdc()).toThrow();
    process.env.X402_PRICE_MICRO_USDC = "1000000000";
    expect(() => getConfiguredX402PriceMicroUsdc()).toThrow();
    process.env.X402_PRICE_MICRO_USDC = "1000";
    expect(getConfiguredX402PriceMicroUsdc()).toBe("1000");
  });
});
