import { afterEach, describe, expect, it } from "vitest";
import { getCommercialCandidate } from "../src/config/commercial.js";

const keys = [
  "BASE_MAINNET_X402_ENABLED",
  "REAL_FUNDS_APPROVED",
  "CDP_API_KEY_ID",
  "CDP_API_KEY_SECRET",
  "SELLER_ADDRESS",
] as const;

describe("commercial production candidate", () => {
  afterEach(() => {
    for (const key of keys) delete process.env[key];
  });

  it("publishes Base metadata while failing closed by default", () => {
    const candidate = getCommercialCandidate();
    expect(candidate).toMatchObject({
      network: "eip155:8453",
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      facilitator: "https://api.cdp.coinbase.com/platform/v2/x402",
      requested: false,
      ready: false,
      realFundsEnabled: false,
    });
    expect(candidate.activationGates.every((gate) => gate.passed)).toBe(false);
  });

  it("requires independent approval, credentials, and a valid seller address", () => {
    process.env.BASE_MAINNET_X402_ENABLED = "true";
    expect(getCommercialCandidate()).toMatchObject({
      requested: true,
      ready: false,
      realFundsEnabled: false,
    });

    process.env.REAL_FUNDS_APPROVED = "true";
    process.env.CDP_API_KEY_ID = "organizations/example/apiKeys/example";
    process.env.CDP_API_KEY_SECRET = "sensitive";
    process.env.SELLER_ADDRESS =
      "0xf1437d9cd304ae49f2ec005ac967813b3a7c466c";
    expect(getCommercialCandidate()).toMatchObject({
      requested: true,
      ready: false,
      realFundsEnabled: false,
    });
    expect(
      getCommercialCandidate().activationGates.find(
        (gate) => gate.id === "production-settlement-adapter",
      )?.passed,
    ).toBe(false);
  });
});
